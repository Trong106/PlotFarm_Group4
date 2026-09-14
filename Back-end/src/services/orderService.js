const { getPool, sql } = require('../config/db');
const { TABLES, PLOT_STATUS } = require('../models');

/**
 * Mock Checkout: Tạo đơn thuê, thanh toán thành công và tự động kích hoạt mùa vụ
 */
const createMockCheckout = async (userId, data) => {
  const pool = getPool();
  const { plotId, seedId, carePackageId, durationMonths = 1, paymentMethod = 'MOMO' } = data;

  if (!plotId || !seedId || !carePackageId) {
    const err = new Error('Thiếu thông tin ô đất, giống cây hoặc gói chăm sóc');
    err.statusCode = 400;
    throw err;
  }

  // 1. Get Plot info
  const plotRes = await pool.request()
    .input('PlotId', sql.Int, plotId)
    .query(`SELECT * FROM Plots WHERE PlotId = @PlotId`);

  if (plotRes.recordset.length === 0) {
    const err = new Error('Ô đất không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  const plot = plotRes.recordset[0];

  // 2. Get Seed info
  const seedRes = await pool.request()
    .input('SeedId', sql.Int, seedId)
    .query(`SELECT * FROM Seeds WHERE SeedId = @SeedId`);

  if (seedRes.recordset.length === 0) {
    const err = new Error('Giống cây trồng không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  const seed = seedRes.recordset[0];

  // 3. Get Care Package info
  const pkgRes = await pool.request()
    .input('PackageId', sql.Int, carePackageId)
    .query(`SELECT * FROM CarePackages WHERE PackageId = @PackageId`);

  if (pkgRes.recordset.length === 0) {
    const err = new Error('Gói chăm sóc không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  const pkg = pkgRes.recordset[0];

  // Calculations
  const rentalFee = (plot.BasePricePerMonth || 450000) * durationMonths;
  const seedFee = seed.SeedPrice || 45000;
  const careFee = (pkg.MonthlyFee || 450000) * durationMonths;
  const totalAmount = rentalFee + seedFee + careFee;
  const totalRentalDays = durationMonths * 30;

  const orderCode = 'PF' + Date.now().toString().slice(-8);
  const now = new Date();
  const endDate = new Date(now.getTime() + totalRentalDays * 24 * 60 * 60 * 1000);
  const growthDays = seed.GrowthDurationDays || 35;
  const harvestDate = new Date(now.getTime() + growthDays * 24 * 60 * 60 * 1000);

  // Execute in Transaction
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
      .input('DurationMonths', sql.Int, durationMonths)
      .input('TotalRentalDays', sql.Int, totalRentalDays)
      .input('StartDate', sql.Date, now)
      .input('EndDate', sql.Date, endDate)
      .input('RentalFee', sql.Decimal(12, 2), rentalFee)
      .input('SeedFee', sql.Decimal(12, 2), seedFee)
      .input('CareFee', sql.Decimal(12, 2), careFee)
      .input('DiscountAmount', sql.Decimal(12, 2), 0)
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
      .input('PlotItemName', sql.NVarChar(100), `Thuê ô đất ${plot.PlotCode} (${plot.SizeM2}m²)`)
      .input('PlotPrice', sql.Decimal(12, 2), rentalFee)
      .query(`
        INSERT INTO OrderDetails (OrderId, ItemType, ItemName, Quantity, UnitPrice, TotalPrice)
        VALUES (@OrderId, 'PLOT', @PlotItemName, 1, @PlotPrice, @PlotPrice)
      `);

    await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('SeedItemName', sql.NVarChar(100), `Hạt giống ${seed.SeedName}`)
      .input('SeedPrice', sql.Decimal(12, 2), seedFee)
      .query(`
        INSERT INTO OrderDetails (OrderId, ItemType, ItemName, Quantity, UnitPrice, TotalPrice)
        VALUES (@OrderId, 'SEED', @SeedItemName, 1, @SeedPrice, @SeedPrice)
      `);

    await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('PkgItemName', sql.NVarChar(100), `Dịch vụ chăm sóc: ${pkg.PackageName}`)
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
      .input('GatewayResponse', sql.NVarChar(sql.MAX), JSON.stringify({ status: 'SUCCESS', method: paymentMethod }))
      .query(`
        INSERT INTO Payments (OrderId, TransactionCode, PaymentMethod, Amount, PaymentDate, Status, GatewayResponse)
        VALUES (@OrderId, @TransactionCode, @PaymentMethod, @Amount, GETDATE(), 'SUCCESS', @GatewayResponse)
      `);

    // D. Update Plot status to RENTED
    await transaction.request()
      .input('PlotId', sql.Int, plotId)
      .query(`UPDATE Plots SET Status = 'RENTED', ReservedUntil = NULL, ReservedByUserId = NULL WHERE PlotId = @PlotId`);

    // E. Create Cultivations record
    const cultInsert = await transaction.request()
      .input('OrderId', sql.Int, orderId)
      .input('PlotId', sql.Int, plotId)
      .input('SeedId', sql.Int, seedId)
      .input('StartDate', sql.Date, now)
      .input('ExpectedHarvestDate', sql.Date, harvestDate)
      .input('ProgressPercent', sql.Decimal(5, 2), 20.0) // initial 20% gieo hạt
      .query(`
        INSERT INTO Cultivations (
          OrderId, PlotId, SeedId, CurrentStageId, StartDate,
          ExpectedHarvestDate, ProgressPercent, Status, ReplantCount, CreatedAt
        )
        OUTPUT INSERTED.CultivationId
        VALUES (
          @OrderId, @PlotId, @SeedId, 1, @StartDate,
          @ExpectedHarvestDate, @ProgressPercent, 'GROWING', 0, GETDATE()
        )
      `);

    const cultivationId = cultInsert.recordset[0].CultivationId;

    await transaction.commit();

    return {
      orderId,
      orderCode,
      cultivationId,
      plotCode: plot.PlotCode,
      seedName: seed.SeedName,
      packageName: pkg.PackageName,
      totalAmount,
      paidAt: now,
      status: 'PAID',
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Lấy danh sách mùa vụ của người dùng (My Farm)
 */
const getMyCultivations = async (userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT 
        c.CultivationId, c.OrderId, c.PlotId, c.SeedId, c.StartDate, c.ExpectedHarvestDate,
        c.ProgressPercent, c.Status as CultivationStatus, c.CreatedAt as CultivationCreatedAt,
        p.PlotCode, p.SizeM2, p.SoilPH, p.StandardHumidity, p.BasePricePerMonth,
        s.SeedName, s.Category, s.GrowthDurationDays, s.ExpectedYieldKgPerM2, s.ImageUrl as SeedImageUrl,
        cp.PackageName, cp.MonthlyFee, cp.ServicesIncluded,
        ro.OrderCode, ro.TotalAmount, ro.PaidAt, ro.DurationMonths
      FROM Cultivations c
      JOIN RentalOrders ro ON c.OrderId = ro.OrderId
      JOIN Plots p ON c.PlotId = p.PlotId
      JOIN Seeds s ON c.SeedId = s.SeedId
      LEFT JOIN CarePackages cp ON ro.CarePackageId = cp.PackageId
      WHERE ro.UserId = @UserId
      ORDER BY c.CreatedAt DESC
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
      ro.TotalAmount, ro.Status, ro.CreatedAt, ro.PaidAt
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
  getAllOrders,
};
