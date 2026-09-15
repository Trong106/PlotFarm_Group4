const db = require('../config/db');
const { sql } = db;

/**
 * 1. Báo cáo & Thống kê Nông nghiệp toàn diện (Analytics)
 */
const getAnalytics = async () => {
  const pool = db.getPool();

  // A. Doanh thu tổng quan
  const revenueRes = await pool.request().query(`
    SELECT 
      ISNULL(SUM(TotalAmount), 0) as TotalRevenue,
      ISNULL(SUM(RentalFee), 0) as TotalRentalFee,
      ISNULL(SUM(CareFee), 0) as TotalCareFee,
      ISNULL(SUM(SeedFee), 0) as TotalSeedFee,
      COUNT(OrderId) as TotalOrders
    FROM RentalOrders
    WHERE Status = 'PAID'
  `);

  // B. Tỷ lệ lấp đầy theo 5 phân khu (Occupancy rate by 5 Areas)
  const occupancyRes = await pool.request().query(`
    SELECT 
      fa.AreaId,
      fa.AreaCode,
      fa.AreaName,
      fa.SoilType,
      COUNT(p.PlotId) as TotalPlots,
      SUM(CASE WHEN p.Status = 'RENTED' THEN 1 ELSE 0 END) as RentedPlots,
      SUM(CASE WHEN p.Status = 'AVAILABLE' THEN 1 ELSE 0 END) as AvailablePlots,
      SUM(CASE WHEN p.Status IN ('MAINTENANCE', 'FALLOWING', 'RESERVED') THEN 1 ELSE 0 END) as OtherPlots,
      ROUND(CAST(SUM(CASE WHEN p.Status = 'RENTED' THEN 1 ELSE 0 END) AS FLOAT) * 100 / NULLIF(COUNT(p.PlotId), 0), 1) as OccupancyRatePercent
    FROM FarmAreas fa
    LEFT JOIN Plots p ON fa.AreaId = p.AreaId
    GROUP BY fa.AreaId, fa.AreaCode, fa.AreaName, fa.SoilType
    ORDER BY fa.AreaId ASC
  `);

  // C. Dự báo sản lượng thu hoạch dự kiến toàn farm (Total expected yield)
  const yieldRes = await pool.request().query(`
    SELECT 
      ISNULL(SUM(p.SizeM2 * s.ExpectedYieldKgPerM2), 0) as TotalExpectedYieldKg,
      COUNT(c.CultivationId) as ActiveCultivationsCount,
      SUM(CASE WHEN c.ProgressPercent >= 90 THEN 1 ELSE 0 END) as ReadyToHarvestCount
    FROM Cultivations c
    JOIN Plots p ON c.PlotId = p.PlotId
    JOIN Seeds s ON c.SeedId = s.SeedId
    WHERE c.Status = 'GROWING'
  `);

  // D. Top 5 giống cây trồng được ưa chuộng nhất
  const topSeedsRes = await pool.request().query(`
    SELECT TOP 5
      s.SeedId,
      s.SeedName,
      s.Category,
      s.GrowthDurationDays,
      s.ImageUrl,
      COUNT(ro.OrderId) as RentCount,
      ISNULL(SUM(ro.TotalAmount), 0) as TotalGeneratedRevenue
    FROM Seeds s
    LEFT JOIN RentalOrders ro ON s.SeedId = ro.SeedId AND ro.Status = 'PAID'
    GROUP BY s.SeedId, s.SeedName, s.Category, s.GrowthDurationDays, s.ImageUrl
    ORDER BY RentCount DESC, TotalGeneratedRevenue DESC
  `);

  return {
    revenue: revenueRes.recordset[0],
    occupancy: occupancyRes.recordset,
    yieldForecast: yieldRes.recordset[0],
    topSeeds: topSeedsRes.recordset,
  };
};

/**
 * 2. Quản lý Gói chăm sóc (Care Packages CRUD)
 */
const getAllPackages = async () => {
  const pool = db.getPool();
  const res = await pool.request().query(`
    SELECT PackageId, PackageName, MonthlyFee, Description, ServicesIncluded, IsActive
    FROM CarePackages
    ORDER BY PackageId ASC
  `);
  return res.recordset;
};

const createPackage = async (data) => {
  const { packageName, monthlyFee, description, servicesIncluded, isActive = 1 } = data;
  if (!packageName || !monthlyFee) {
    throw Object.assign(new Error('Tên gói và giá theo tháng là bắt buộc'), { statusCode: 400 });
  }

  const pool = db.getPool();
  const res = await pool.request()
    .input('PackageName', sql.NVarChar(100), packageName)
    .input('MonthlyFee', sql.Decimal(12, 2), monthlyFee)
    .input('Description', sql.NVarChar(500), description || '')
    .input('ServicesIncluded', sql.NVarChar(1000), servicesIncluded || '')
    .input('IsActive', sql.Bit, isActive ? 1 : 0)
    .query(`
      INSERT INTO CarePackages (PackageName, MonthlyFee, Description, ServicesIncluded, IsActive)
      OUTPUT INSERTED.*
      VALUES (@PackageName, @MonthlyFee, @Description, @ServicesIncluded, @IsActive)
    `);

  return res.recordset[0];
};

const updatePackage = async (packageId, data) => {
  const { packageName, monthlyFee, description, servicesIncluded, isActive } = data;
  const pool = db.getPool();

  const res = await pool.request()
    .input('PackageId', sql.Int, packageId)
    .input('PackageName', sql.NVarChar(100), packageName)
    .input('MonthlyFee', sql.Decimal(12, 2), monthlyFee)
    .input('Description', sql.NVarChar(500), description)
    .input('ServicesIncluded', sql.NVarChar(1000), servicesIncluded)
    .input('IsActive', sql.Bit, isActive !== undefined ? (isActive ? 1 : 0) : 1)
    .query(`
      UPDATE CarePackages
      SET 
        PackageName = COALESCE(@PackageName, PackageName),
        MonthlyFee = COALESCE(@MonthlyFee, MonthlyFee),
        Description = COALESCE(@Description, Description),
        ServicesIncluded = COALESCE(@ServicesIncluded, ServicesIncluded),
        IsActive = COALESCE(@IsActive, IsActive)
      OUTPUT INSERTED.*
      WHERE PackageId = @PackageId
    `);

  if (res.recordset.length === 0) {
    throw Object.assign(new Error('Không tìm thấy gói chăm sóc'), { statusCode: 404 });
  }

  return res.recordset[0];
};

const deletePackage = async (packageId) => {
  const pool = db.getPool();
  const res = await pool.request()
    .input('PackageId', sql.Int, packageId)
    .query(`
      UPDATE CarePackages SET IsActive = 0
      OUTPUT INSERTED.PackageId, INSERTED.IsActive
      WHERE PackageId = @PackageId
    `);

  if (res.recordset.length === 0) {
    throw Object.assign(new Error('Không tìm thấy gói chăm sóc'), { statusCode: 404 });
  }

  return { packageId, success: true };
};

/**
 * 3. Quản lý Giống cây trồng (Seeds CRUD)
 */
const getAllSeeds = async () => {
  const pool = db.getPool();
  const res = await pool.request().query(`
    SELECT SeedId, SeedName, Category, GrowthDurationDays, MinRentalDays,
           ExpectedYieldKgPerM2, SuitableSoilType, Season, SeedPrice,
           ImageUrl, Description, IsAvailable
    FROM Seeds
    ORDER BY SeedId ASC
  `);
  return res.recordset;
};

const createSeed = async (data) => {
  const {
    seedName, category, growthDurationDays, minRentalDays = 30,
    expectedYieldKgPerM2, suitableSoilType, season = 'Quanh năm',
    seedPrice, imageUrl, description, isAvailable = 1
  } = data;

  if (!seedName || !growthDurationDays || !seedPrice) {
    throw Object.assign(new Error('Tên giống cây, số ngày sinh trưởng và giá hạt giống là bắt buộc'), { statusCode: 400 });
  }

  const pool = db.getPool();
  const res = await pool.request()
    .input('SeedName', sql.NVarChar(100), seedName)
    .input('Category', sql.NVarChar(50), category || 'Rau ăn lá')
    .input('GrowthDurationDays', sql.Int, growthDurationDays)
    .input('MinRentalDays', sql.Int, minRentalDays)
    .input('ExpectedYieldKgPerM2', sql.Decimal(5, 2), expectedYieldKgPerM2 || 3.0)
    .input('SuitableSoilType', sql.NVarChar(100), suitableSoilType || 'Đất hữu cơ')
    .input('Season', sql.NVarChar(50), season)
    .input('SeedPrice', sql.Decimal(12, 2), seedPrice)
    .input('ImageUrl', sql.NVarChar(255), imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999')
    .input('Description', sql.NVarChar(500), description || '')
    .input('IsAvailable', sql.Bit, isAvailable ? 1 : 0)
    .query(`
      INSERT INTO Seeds (
        SeedName, Category, GrowthDurationDays, MinRentalDays,
        ExpectedYieldKgPerM2, SuitableSoilType, Season, SeedPrice,
        ImageUrl, Description, IsAvailable
      )
      OUTPUT INSERTED.*
      VALUES (
        @SeedName, @Category, @GrowthDurationDays, @MinRentalDays,
        @ExpectedYieldKgPerM2, @SuitableSoilType, @Season, @SeedPrice,
        @ImageUrl, @Description, @IsAvailable
      )
    `);

  return res.recordset[0];
};

const updateSeed = async (seedId, data) => {
  const {
    seedName, category, growthDurationDays, minRentalDays,
    expectedYieldKgPerM2, suitableSoilType, season,
    seedPrice, imageUrl, description, isAvailable
  } = data;

  const pool = db.getPool();
  const res = await pool.request()
    .input('SeedId', sql.Int, seedId)
    .input('SeedName', sql.NVarChar(100), seedName)
    .input('Category', sql.NVarChar(50), category)
    .input('GrowthDurationDays', sql.Int, growthDurationDays)
    .input('MinRentalDays', sql.Int, minRentalDays)
    .input('ExpectedYieldKgPerM2', sql.Decimal(5, 2), expectedYieldKgPerM2)
    .input('SuitableSoilType', sql.NVarChar(100), suitableSoilType)
    .input('Season', sql.NVarChar(50), season)
    .input('SeedPrice', sql.Decimal(12, 2), seedPrice)
    .input('ImageUrl', sql.NVarChar(255), imageUrl)
    .input('Description', sql.NVarChar(500), description)
    .input('IsAvailable', sql.Bit, isAvailable !== undefined ? (isAvailable ? 1 : 0) : null)
    .query(`
      UPDATE Seeds
      SET 
        SeedName = COALESCE(@SeedName, SeedName),
        Category = COALESCE(@Category, Category),
        GrowthDurationDays = COALESCE(@GrowthDurationDays, GrowthDurationDays),
        MinRentalDays = COALESCE(@MinRentalDays, MinRentalDays),
        ExpectedYieldKgPerM2 = COALESCE(@ExpectedYieldKgPerM2, ExpectedYieldKgPerM2),
        SuitableSoilType = COALESCE(@SuitableSoilType, SuitableSoilType),
        Season = COALESCE(@Season, Season),
        SeedPrice = COALESCE(@SeedPrice, SeedPrice),
        ImageUrl = COALESCE(@ImageUrl, ImageUrl),
        Description = COALESCE(@Description, Description),
        IsAvailable = COALESCE(@IsAvailable, IsAvailable)
      OUTPUT INSERTED.*
      WHERE SeedId = @SeedId
    `);

  if (res.recordset.length === 0) {
    throw Object.assign(new Error('Không tìm thấy giống cây trồng'), { statusCode: 404 });
  }

  return res.recordset[0];
};

const deleteSeed = async (seedId) => {
  const pool = db.getPool();
  const res = await pool.request()
    .input('SeedId', sql.Int, seedId)
    .query(`
      UPDATE Seeds SET IsAvailable = 0
      OUTPUT INSERTED.SeedId, INSERTED.IsAvailable
      WHERE SeedId = @SeedId
    `);

  if (res.recordset.length === 0) {
    throw Object.assign(new Error('Không tìm thấy giống cây trồng'), { statusCode: 404 });
  }

  return { seedId, success: true };
};

/**
 * 4. Phân công nhân viên kỹ thuật phụ trách các phân khu (Staff Assignments)
 */
const getStaffAssignments = async () => {
  const pool = db.getPool();
  const res = await pool.request().query(`
    SELECT 
      sa.AssignmentId,
      sa.StaffId,
      u.FullName as StaffName,
      u.Email as StaffEmail,
      u.PhoneNumber as StaffPhone,
      sa.AreaId,
      fa.AreaCode,
      fa.AreaName,
      sa.Shift,
      sa.AssignedDate,
      sa.Notes
    FROM StaffAssignments sa
    JOIN Users u ON sa.StaffId = u.UserId
    JOIN FarmAreas fa ON sa.AreaId = fa.AreaId
    ORDER BY fa.AreaId ASC, sa.AssignedDate DESC
  `);
  return res.recordset;
};

const getStaffUsers = async () => {
  const pool = db.getPool();
  const res = await pool.request().query(`
    SELECT u.UserId, u.FullName, u.Email, u.PhoneNumber, r.RoleName
    FROM Users u
    JOIN Roles r ON u.RoleId = r.RoleId
    WHERE r.RoleName = 'Staff' AND u.Status = 'ACTIVE'
    ORDER BY u.FullName ASC
  `);
  return res.recordset;
};

const createStaffAssignment = async (data) => {
  const { staffId, areaId, shift = 'Toàn thời gian (07:00 - 17:00)', notes } = data;
  if (!staffId || !areaId) {
    throw Object.assign(new Error('Mã nhân viên (staffId) và phân khu (areaId) là bắt buộc'), { statusCode: 400 });
  }

  const pool = db.getPool();
  const res = await pool.request()
    .input('StaffId', sql.Int, staffId)
    .input('AreaId', sql.Int, areaId)
    .input('Shift', sql.NVarChar(100), shift)
    .input('AssignedDate', sql.Date, new Date())
    .input('Notes', sql.NVarChar(500), notes || 'Phụ trách kiểm tra độ ẩm, sâu bệnh và cập nhật nhật ký canh tác')
    .query(`
      INSERT INTO StaffAssignments (StaffId, AreaId, Shift, AssignedDate, Notes)
      OUTPUT INSERTED.*
      VALUES (@StaffId, @AreaId, @Shift, @AssignedDate, @Notes)
    `);

  return res.recordset[0];
};

const deleteStaffAssignment = async (assignmentId) => {
  const pool = db.getPool();
  const res = await pool.request()
    .input('AssignmentId', sql.Int, assignmentId)
    .query(`
      DELETE FROM StaffAssignments
      OUTPUT DELETED.AssignmentId
      WHERE AssignmentId = @AssignmentId
    `);

  if (res.recordset.length === 0) {
    throw Object.assign(new Error('Không tìm thấy bản ghi phân công'), { statusCode: 404 });
  }

  return { assignmentId, success: true };
};

module.exports = {
  getAnalytics,
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getAllSeeds,
  createSeed,
  updateSeed,
  deleteSeed,
  getStaffAssignments,
  getStaffUsers,
  createStaffAssignment,
  deleteStaffAssignment,
};
