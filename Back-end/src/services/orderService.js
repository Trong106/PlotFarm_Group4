const { getPool, sql } = require('../config/db');
const { TABLES, PLOT_STATUS } = require('../models');
const { generateCareSchedule } = require('./scheduleEngine');

/**
 * Mock Checkout: Tạo đơn thuê, thanh toán thành công và tự động kích hoạt mùa vụ
 * Đồng bộ thời gian thuê đất gắn liền trực tiếp với chu kỳ sinh trưởng của cây trồng (X ngày/vụ)
 */
const createMockCheckout = async (userId, data) => {
  const pool = getPool();
  const { plotId, seedId, carePackageId, durationMonths, cycles = 1, rentalDays, paymentMethod = 'MOMO' } = data;

  if (!plotId || !seedId || !carePackageId) {
    const err = new Error('Thiếu thông tin ô đất, giống cây hoặc gói chăm sóc');
    err.statusCode = 400;
    throw err;
  }

    // 1. Lấy thông tin Plot và kiểm tra quyền giữ chỗ
  const plotRes = await pool.request()
    .input('PlotId', sql.Int, plotId)
    .query(`
      SELECT *,
             CAST(CASE WHEN ReservedUntil IS NOT NULL AND ReservedUntil < SYSDATETIME() THEN 1 ELSE 0 END AS BIT) AS IsReservedExpired
      FROM Plots
      WHERE PlotId = @PlotId
    `);

  if (plotRes.recordset.length === 0) {
    const err = new Error('Ô đất không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  const plot = plotRes.recordset[0];

  // Kiểm tra trạng thái và quyền giữ chỗ độc quyền
  const isReservedExpired = Boolean(plot.IsReservedExpired);
  if (plot.Status === 'RESERVED' && !isReservedExpired && plot.ReservedByUserId && Number(plot.ReservedByUserId) !== Number(userId)) {
    const err = new Error(`Ô đất ${plot.PlotCode || ''} đang được khách hàng khác giữ chỗ độc quyền trong 15 phút.`);
    err.statusCode = 409;
    throw err;
  }
  if (plot.Status === 'RENTED' || plot.Status === 'MAINTENANCE' || plot.Status === 'FALLOWING') {
    const err = new Error(`Ô đất đang ở trạng thái ${plot.Status}, không thể hoàn tất đặt thuê.`);
    err.statusCode = 400;
    throw err;
  }


  // 2. Lấy thông tin Seed (Giống cây)
  const seedRes = await pool.request()
    .input('SeedId', sql.Int, seedId)
    .query(`SELECT * FROM Seeds WHERE SeedId = @SeedId`);

  if (seedRes.recordset.length === 0) {
    const err = new Error('Giống cây trồng không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  const seed = seedRes.recordset[0];

  // 3. Lấy thông tin CarePackage
  const pkgRes = await pool.request()
    .input('PackageId', sql.Int, carePackageId)
    .query(`SELECT * FROM CarePackages WHERE PackageId = @PackageId`);

  if (pkgRes.recordset.length === 0) {
    const err = new Error('Gói chăm sóc không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  const pkg = pkgRes.recordset[0];

  // 4. Tính toán thời gian thuê chuẩn theo chu kỳ sinh trưởng của cây
  const growthDays = seed.GrowthDurationDays || 45;
  const cyclesCount = Number(cycles) || 1;

  let totalRentalDays;
  if (rentalDays && Number(rentalDays) > 0) {
    totalRentalDays = Number(rentalDays);
  } else if (data.durationMonths && !data.cycles && !data.rentalDays) {
    totalRentalDays = Number(durationMonths) * 30;
  } else {
    totalRentalDays = growthDays * cyclesCount;
  }

  const storedDurationMonths = Math.max(1, Math.ceil(totalRentalDays / 30));

  // 5. Tính phí minh bạch theo ngày
  const plotDailyRate = (plot.BasePricePerMonth || 450000) / 30;
  const careDailyRate = (pkg.MonthlyFee || 450000) / 30;

  const rentalFee = Math.round(plotDailyRate * totalRentalDays);
  const careFee = Math.round(careDailyRate * totalRentalDays);
  const seedFee = (seed.SeedPrice || 45000) * cyclesCount;

  // Ưu đãi thuê nhiều vụ
  let discountAmount = 0;
  if (cyclesCount >= 3) {
    discountAmount = Math.round((rentalFee + careFee) * 0.10); // Giảm 10%
  } else if (cyclesCount >= 2) {
    discountAmount = Math.round((rentalFee + careFee) * 0.05); // Giảm 5%
  }

  const totalAmount = rentalFee + seedFee + careFee - discountAmount;

  const orderCode = 'PF' + Date.now().toString().slice(-8);
  const now = new Date();
  const endDate = new Date(now.getTime() + totalRentalDays * 24 * 60 * 60 * 1000);
  const harvestDate = new Date(now.getTime() + growthDays * 24 * 60 * 60 * 1000);

  // Thực thi Transaction
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // A. Insert RentalOrders
    const orderInsert = await transaction.request()
      .input('OrderCode', sql.NVarChar(50), orderCode)
      .input('UserId', sql.Int, userId)
      .input('PlotId', sql.Int, plotId)
      .input('SeedId', sql.Int, seedId)
      .input('CarePackageId', sql.Int, carePackageId)
      .input('DurationMonths', sql.Int, storedDurationMonths)
      .input('TotalRentalDays', sql.Int, totalRentalDays)
      .input('StartDate', sql.Date, now)
      .input('EndDate', sql.Date, endDate)
      .input('RentalFee', sql.Decimal(12, 2), rentalFee)
      .input('SeedFee', sql.Decimal(12, 2), seedFee)
      .input('CareFee', sql.Decimal(12, 2), careFee)
      .input('DiscountAmount', sql.Decimal(12, 2), discountAmount)
      .input('TotalAmount', sql.Decimal(12, 2), totalAmount)
      .input('Status', sql.NVarChar(30), 'PAID')
      .query(`
        INSERT INTO RentalOrders (
          OrderCode, UserId, PlotId, SeedId, CarePackageId, DurationMonths,
          TotalRentalDays, StartDate, EndDate, RentalFee, SeedFee, CareFee,
          DiscountAmount, TotalAmount, Status, CreatedAt, PaidAt
        )
        OUTPUT INSERTED.OrderId
        VALUES (
          @OrderCode, @UserId, @PlotId, @SeedId, @CarePackageId, @DurationMonths,
          @TotalRentalDays, @StartDate, @EndDate, @RentalFee, @SeedFee, @CareFee,
          @DiscountAmount, @TotalAmount, @Status, GETDATE(), GETDATE()
        )
      `);

    const orderId = orderInsert.recordset[0].OrderId;

    // B. Insert OrderDetails
    await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('PlotItemName', sql.NVarChar(100), `Thuê ô đất ${plot.PlotCode} (${plot.SizeM2}m² - ${totalRentalDays} ngày)`)
      .input('PlotPrice', sql.Decimal(12, 2), rentalFee)
      .query(`
        INSERT INTO OrderDetails (OrderId, ItemType, ItemName, Quantity, UnitPrice, TotalPrice)
        VALUES (@OrderId, 'PLOT', @PlotItemName, 1, @PlotPrice, @PlotPrice)
      `);

    await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('SeedItemName', sql.NVarChar(100), `Hạt giống ${seed.SeedName} (${cyclesCount} vụ)`)
      .input('SeedPrice', sql.Decimal(12, 2), seedFee)
      .query(`
        INSERT INTO OrderDetails (OrderId, ItemType, ItemName, Quantity, UnitPrice, TotalPrice)
        VALUES (@OrderId, 'SEED', @SeedItemName, 1, @SeedPrice, @SeedPrice)
      `);

    await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('PkgItemName', sql.NVarChar(100), `Dịch vụ chăm sóc: ${pkg.PackageName} (${totalRentalDays} ngày)`)
      .input('PkgPrice', sql.Decimal(12, 2), careFee)
      .query(`
        INSERT INTO OrderDetails (OrderId, ItemType, ItemName, Quantity, UnitPrice, TotalPrice)
        VALUES (@OrderId, 'CARE_PACKAGE', @PkgItemName, 1, @PkgPrice, @PkgPrice)
      `);

    // C. Insert Payments
    const txCode = 'TXN_' + Date.now();
    await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('TransactionCode', sql.NVarChar(50), txCode)
      .input('PaymentMethod', sql.NVarChar(30), paymentMethod)
      .input('Amount', sql.Decimal(12, 2), totalAmount)
      .input('GatewayResponse', sql.NVarChar(sql.MAX), JSON.stringify({ status: 'SUCCESS', method: paymentMethod, cycles: cyclesCount, rentalDays: totalRentalDays }))
      .query(`
        INSERT INTO Payments (OrderId, TransactionCode, PaymentMethod, Amount, PaymentDate, Status, GatewayResponse)
        VALUES (@OrderId, @TransactionCode, @PaymentMethod, @Amount, GETDATE(), 'SUCCESS', @GatewayResponse)
      `);

    // D. Update Plot status to RENTED
    await transaction.request()
      .input('PlotId', sql.Int, plotId)
      .query(`UPDATE Plots SET Status = 'RENTED', ReservedUntil = NULL, ReservedByUserId = NULL WHERE PlotId = @PlotId`);

    // E. Use the chosen seed's first stage, or NULL when its catalog is not seeded yet.
    const cultInsert = await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('PlotId', sql.Int, plotId)
      .input('SeedId', sql.Int, seedId)
      .input('StartDate', sql.Date, now)
      .input('ExpectedHarvestDate', sql.Date, harvestDate)
      .input('ProgressPercent', sql.Decimal(5, 2), 15.0) // 15% giai đoạn chuẩn bị & gieo hạt ban đầu
      .query(`
        INSERT INTO Cultivations (
          OrderId, PlotId, SeedId, CurrentStageId, StartDate,
          ExpectedHarvestDate, ProgressPercent, Status, ReplantCount, CreatedAt
        )
        OUTPUT INSERTED.CultivationId
        VALUES (
          @OrderId, @PlotId, @SeedId,
          (SELECT TOP (1) StageId FROM GrowthStages WHERE SeedId = @SeedId ORDER BY StageOrder, StageId), @StartDate,
          @ExpectedHarvestDate, @ProgressPercent, 'GROWING', 0, GETDATE()
        )
      `);

    const cultivationId = cultInsert.recordset[0].CultivationId;

    await transaction.commit();

    // ── Automation: Tự động sinh lịch chăm sóc dự kiến (sau khi commit thành công)
    // Gọi ngoài transaction để tránh ảnh hưởng đến luồng thanh toán chính.
    // Nếu lỗi sinh lịch, đơn hàng vẫn được tạo thành công — chỉ ghi log cảnh báo.
    let careScheduleSummary = null;
    try {
      careScheduleSummary = await generateCareSchedule({
        cultivationId,
        packageId: carePackageId,
        packageName: pkg.PackageName,
        startDate: now,
        totalDays: totalRentalDays,
      });
      console.log(`[Automation] ✅ Đã sinh ${careScheduleSummary.generated} lịch chăm sóc cho Cultivation #${cultivationId}`);
    } catch (scheduleErr) {
      // Non-fatal: Ghi log nhưng không throw — đơn hàng vẫn hợp lệ
      console.warn(`[Automation] ⚠️ Không thể sinh lịch chăm sóc cho Cultivation #${cultivationId}:`, scheduleErr.message);
    }

    return {
      orderId,
      orderCode,
      cultivationId,
      plotCode: plot.PlotCode,
      seedName: seed.SeedName,
      packageName: pkg.PackageName,
      cycles: cyclesCount,
      totalRentalDays,
      growthDays,
      totalAmount,
      paidAt: now,
      status: 'PAID',
      // Thông tin lịch chăm sóc đã sinh (để trả về cho client nếu cần)
      careSchedule: careScheduleSummary ? {
        generated: careScheduleSummary.generated,
        tier: careScheduleSummary.tier,
        breakdown: careScheduleSummary.breakdown,
      } : null,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Lấy danh sách mùa vụ của người dùng (My Farm) kèm thông tin Camera giám sát
 */
const getMyCultivations = async (userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT 
        c.CultivationId, c.OrderId, c.PlotId, c.SeedId, c.StartDate, c.ExpectedHarvestDate,
        c.ProgressPercent, c.Status as CultivationStatus, c.CreatedAt as CultivationCreatedAt,
        p.PlotCode, p.SizeM2, p.SoilPH, p.StandardHumidity, p.BasePricePerMonth, p.AreaId,
        s.SeedName, s.Category, s.GrowthDurationDays, s.ExpectedYieldKgPerM2, s.ImageUrl as SeedImageUrl,
        cp.PackageName, cp.MonthlyFee, cp.ServicesIncluded,
        ro.OrderCode, ro.TotalAmount, ro.PaidAt, ro.DurationMonths, ro.TotalRentalDays,
        ro.RentalFee, ro.CareFee, ro.SeedFee, ro.DiscountAmount,
        cam.CameraCode, cam.CameraName, cam.StreamUrl, cam.Status as CameraStatus,
        COALESCE(staff_info.StaffName, log_staff.StaffName, def_staff.FullName, N'Trần Minh Tuấn') AS StaffName,
        COALESCE(staff_info.StaffPhone, log_staff.StaffPhone, def_staff.PhoneNumber, '0900000002') AS StaffPhone,
        COALESCE(staff_info.StaffEmail, log_staff.StaffEmail, def_staff.Email, 'tuan@plotfarm.vn') AS StaffEmail,
        COALESCE(staff_info.StaffShift, N'Sáng') AS StaffShift
      FROM Cultivations c
      JOIN RentalOrders ro ON c.OrderId = ro.OrderId
      JOIN Plots p ON c.PlotId = p.PlotId
      JOIN Seeds s ON c.SeedId = s.SeedId
      LEFT JOIN CarePackages cp ON ro.CarePackageId = cp.PackageId
      LEFT JOIN Cameras cam ON p.CameraId = cam.CameraId
      OUTER APPLY (
        SELECT TOP 1 
          u_staff.FullName AS StaffName,
          u_staff.PhoneNumber AS StaffPhone,
          u_staff.Email AS StaffEmail,
          sa.Shift AS StaffShift
        FROM StaffAssignments sa
        JOIN Users u_staff ON sa.StaffId = u_staff.UserId
        WHERE sa.AreaId = p.AreaId AND (sa.PlotId IS NULL OR sa.PlotId = p.PlotId)
        ORDER BY sa.AssignmentId ASC
      ) staff_info
      OUTER APPLY (
        SELECT TOP 1 
          u_log.FullName AS StaffName,
          u_log.PhoneNumber AS StaffPhone,
          u_log.Email AS StaffEmail
        FROM CultivationLogs cl
        JOIN Users u_log ON cl.StaffId = u_log.UserId
        WHERE cl.CultivationId = c.CultivationId
        ORDER BY cl.LogDate DESC, cl.CreatedAt DESC
      ) log_staff
      OUTER APPLY (
        SELECT TOP 1 FullName, PhoneNumber, Email 
        FROM Users 
        WHERE RoleId = 2 
        ORDER BY UserId ASC
      ) def_staff
      WHERE ro.UserId = @UserId
      ORDER BY c.CreatedAt DESC
    `);

  return result.recordset;
};

/**
 * Lấy danh sách đơn hàng của người dùng (Customer Order History)
 */
const getMyOrders = async (userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT 
        ro.OrderId, ro.OrderCode, ro.PlotId, ro.SeedId, ro.CarePackageId,
        ro.DurationMonths, ro.TotalRentalDays, ro.StartDate, ro.EndDate,
        ro.RentalFee, ro.SeedFee, ro.CareFee, ro.DiscountAmount, ro.TotalAmount,
        ro.Status, ro.CreatedAt, ro.PaidAt,
        p.PlotCode, p.SizeM2,
        s.SeedName, s.ImageUrl as SeedImageUrl,
        cp.PackageName,
        pay.TransactionCode, pay.PaymentMethod, pay.PaymentDate
      FROM RentalOrders ro
      JOIN Plots p ON ro.PlotId = p.PlotId
      JOIN Seeds s ON ro.SeedId = s.SeedId
      LEFT JOIN CarePackages cp ON ro.CarePackageId = cp.PackageId
      OUTER APPLY (
        SELECT TOP 1 TransactionCode, PaymentMethod, PaymentDate
        FROM Payments
        WHERE OrderId = ro.OrderId
        ORDER BY PaymentId DESC
      ) pay
      WHERE ro.UserId = @UserId
      ORDER BY ro.CreatedAt DESC
    `);
  return result.recordset;
};

/**
 * Lấy toàn bộ đơn hàng (Dành cho Admin)
 */
const getAllOrders = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT 
      ro.OrderId, ro.OrderCode, ro.UserId, u.FullName, u.Email,
      p.PlotCode, s.SeedName, cp.PackageName,
      ro.TotalAmount, ro.Status, ro.CreatedAt, ro.PaidAt,
      ro.DurationMonths, ro.TotalRentalDays, ro.StartDate, ro.EndDate
    FROM RentalOrders ro
    JOIN Users u ON ro.UserId = u.UserId
    JOIN Plots p ON ro.PlotId = p.PlotId
    JOIN Seeds s ON ro.SeedId = s.SeedId
    LEFT JOIN CarePackages cp ON ro.CarePackageId = cp.PackageId
    ORDER BY ro.CreatedAt DESC
  `);
  return result.recordset;
};

module.exports = {
  createMockCheckout,
  getMyCultivations,
  getMyOrders,
  getAllOrders,
};
