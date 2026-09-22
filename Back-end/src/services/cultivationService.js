const { getPool, sql } = require('../config/db');

/**
 * Lấy danh sách nhật ký canh tác theo CultivationId
 */
const getCultivationLogs = async (cultivationId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('CultivationId', sql.Int, cultivationId)
    .query(`
      SELECT 
        l.LogId, l.CultivationId, l.StaffId, l.LogDate, l.ActivityType,
        l.Title, l.Notes, l.ImageUrl, l.VideoUrl, l.PlantHealthStatus, l.CreatedAt,
        u.FullName as StaffName
      FROM CultivationLogs l
      LEFT JOIN Users u ON l.StaffId = u.UserId
      WHERE l.CultivationId = @CultivationId
      ORDER BY l.LogDate DESC, l.CreatedAt DESC
    `);
  return result.recordset;
};

/**
 * Thêm một nhật ký canh tác mới
 */
const createCultivationLog = async ({ cultivationId, staffId = 2, activityType, title, notes, imageUrl, plantHealthStatus = 'EXCELLENT' }) => {
  const pool = getPool();

  const check = await pool.request()
    .input('CultivationId', sql.Int, cultivationId)
    .query('SELECT CultivationId FROM Cultivations WHERE CultivationId = @CultivationId');

  if (check.recordset.length === 0) {
    const error = new Error('Mùa vụ canh tác không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const result = await pool.request()
    .input('CultivationId', sql.Int, cultivationId)
    .input('StaffId', sql.Int, staffId)
    .input('ActivityType', sql.NVarChar(50), activityType)
    .input('Title', sql.NVarChar(150), title)
    .input('Notes', sql.NVarChar(sql.MAX), notes || '')
    .input('ImageUrl', sql.NVarChar(500), imageUrl || null)
    .input('PlantHealthStatus', sql.NVarChar(50), plantHealthStatus)
    .query(`
      INSERT INTO CultivationLogs (CultivationId, StaffId, LogDate, ActivityType, Title, Notes, ImageUrl, PlantHealthStatus, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@CultivationId, @StaffId, GETDATE(), @ActivityType, @Title, @Notes, @ImageUrl, @PlantHealthStatus, GETDATE())
    `);
  return result.recordset[0];
};

/**
 * Tạo yêu cầu chăm sóc đột xuất (Care Request)
 */
const createCareRequest = async (userId, { cultivationId, serviceType, customerNote }) => {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {

    // Validate cultivation exists & belongs to user
    const cultCheck = await transaction.request()
      .input('CultivationId', sql.Int, cultivationId)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT c.CultivationId, c.Status
        FROM Cultivations c WITH (UPDLOCK, HOLDLOCK)
        JOIN RentalOrders ro ON c.OrderId = ro.OrderId
        WHERE c.CultivationId = @CultivationId AND ro.UserId = @UserId
      `);

    if (cultCheck.recordset.length === 0) {
      const err = new Error('Không tìm thấy mùa vụ hoặc bạn không có quyền gửi yêu cầu');
      err.statusCode = 404;
      throw err;
    }

    if (['HARVESTED', 'FAILED'].includes(cultCheck.recordset[0].Status)) {
      const err = new Error('Vụ mùa đã kết thúc. Không thể gửi thêm yêu cầu chăm sóc hoặc thu hoạch.');
      err.statusCode = 409;
      throw err;
    }

    const result = await transaction.request()
      .input('CultivationId', sql.Int, cultivationId)
      .input('UserId', sql.Int, userId)
      .input('ServiceType', sql.NVarChar(100), serviceType)
      .input('CustomerNote', sql.NVarChar(500), customerNote || '')
      .query(`
        INSERT INTO CareRequests (
          CultivationId, UserId, ServiceType, CustomerNote,
          AdditionalFee, IsFeeAccepted, PaymentStatus, Status, RequestedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @CultivationId, @UserId, @ServiceType, @CustomerNote,
          0, 1, 'PAID', 'PENDING', GETDATE()
        )
      `);

    await transaction.commit();
    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Lấy danh sách yêu cầu chăm sóc của người dùng
 */
const getMyCareRequests = async (userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT 
        cr.RequestId, cr.CultivationId, cr.ServiceType, cr.CustomerNote,
        cr.Status, cr.ResultNote, cr.ResultImageUrl, cr.RequestedAt, cr.CompletedAt,
        p.PlotCode, s.SeedName, u.FullName as StaffName
      FROM CareRequests cr
      JOIN Cultivations c ON cr.CultivationId = c.CultivationId
      JOIN Plots p ON c.PlotId = p.PlotId
      JOIN Seeds s ON c.SeedId = s.SeedId
      LEFT JOIN Users u ON cr.AssignedStaffId = u.UserId
      WHERE cr.UserId = @UserId
      ORDER BY cr.RequestedAt DESC
    `);
  return result.recordset;
};

/**
 * Tạo yêu cầu thu hoạch & giao hàng (Harvest Request & Delivery)
 */
const createHarvestRequest = async (userId, { cultivationId, harvestType = 'GIAO_TAN_NOI', recipientName, phoneNumber, deliveryAddress, customerNote }) => {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Validate cultivation exists & belongs to user
    const cultCheck = await transaction.request()
      .input('CultivationId', sql.Int, cultivationId)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT c.CultivationId, c.Status, p.PlotCode, s.SeedName
        FROM Cultivations c WITH (UPDLOCK, HOLDLOCK)
        JOIN RentalOrders ro ON c.OrderId = ro.OrderId
        JOIN Plots p ON c.PlotId = p.PlotId
        JOIN Seeds s ON c.SeedId = s.SeedId
        WHERE c.CultivationId = @CultivationId AND ro.UserId = @UserId
      `);

    if (cultCheck.recordset.length === 0) {
      const err = new Error('Không tìm thấy mùa vụ canh tác này');
      err.statusCode = 404;
      throw err;
    }

    const cult = cultCheck.recordset[0];
    if (cult.Status !== 'READY_TO_HARVEST') {
      const err = new Error('Vụ mùa chưa đủ điều kiện thu hoạch hoặc đã kết thúc. Chỉ gửi yêu cầu khi kỹ thuật viên xác nhận sẵn sàng thu hoạch.');
      err.statusCode = 409;
      throw err;
    }
    const existing = await transaction.request()
      .input('CultivationId', sql.Int, cultivationId)
      .query(`SELECT HarvestRequestId FROM HarvestRequests WHERE CultivationId = @CultivationId AND Status <> 'CANCELLED'`);
    if (existing.recordset.length) {
      const err = new Error('Vụ mùa này đã có yêu cầu thu hoạch. Vui lòng theo dõi yêu cầu hiện tại.');
      err.statusCode = 409;
      throw err;
    }
    // 1. Insert HarvestRequests with Status = 'REQUESTED' (valid per CK_HarvestRequests_Status)
    const hrInsert = await transaction.request()
      .input('CultivationId', sql.Int, cultivationId)
      .input('UserId', sql.Int, userId)
      .input('HarvestType', sql.NVarChar(50), harvestType)
      .input('CustomerNote', sql.NVarChar(500), customerNote || '')
      .query(`
        INSERT INTO HarvestRequests (CultivationId, UserId, HarvestType, RequestDate, Status, CustomerNote)
        OUTPUT INSERTED.HarvestRequestId
        VALUES (@CultivationId, @UserId, @HarvestType, GETDATE(), 'REQUESTED', @CustomerNote)
      `);

    const harvestRequestId = hrInsert.recordset[0].HarvestRequestId;

    // 2. If delivery requested, insert into Deliveries with Status = 'PACKING' (valid per CK_Deliveries_Status)
    let delivery = null;
    if (harvestType === 'GIAO_TAN_NOI') {
      const trackingCode = 'PF-GHTK-' + Math.floor(100000 + Math.random() * 900000);
      const delInsert = await transaction.request()
        .input('HarvestRequestId', sql.Int, harvestRequestId)
        .input('RecipientName', sql.NVarChar(100), recipientName || 'Khách Hàng PlotFarm')
        .input('PhoneNumber', sql.NVarChar(20), phoneNumber || '0901234567')
        .input('DeliveryAddress', sql.NVarChar(255), deliveryAddress || 'Địa chỉ đăng ký')
        .input('CarrierName', sql.NVarChar(100), 'Giao Hàng Tiết Kiệm (GHTK)')
        .input('TrackingCode', sql.NVarChar(100), trackingCode)
        .input('ShippingFee', sql.Decimal(12, 2), 35000)
        .query(`
          INSERT INTO Deliveries (
            HarvestRequestId, RecipientName, PhoneNumber, DeliveryAddress,
            CarrierName, TrackingCode, ShippingFee, Status, ShippedAt
          )
          OUTPUT INSERTED.*
          VALUES (
            @HarvestRequestId, @RecipientName, @PhoneNumber, @DeliveryAddress,
            @CarrierName, @TrackingCode, @ShippingFee, 'PACKING', GETDATE()
          )
        `);
      delivery = delInsert.recordset[0];
    }

    // Requesting harvest does not mean harvesting has been completed.

    await transaction.commit();

    return {
      harvestRequestId,
      cultivationId,
      harvestType,
      status: 'REQUESTED',
      delivery,
      plotCode: cult.PlotCode,
      seedName: cult.SeedName,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Lấy danh sách vận chuyển đơn thu hoạch của người dùng (Delivery Tracking)
 */
const getMyDeliveries = async (userId) => {
  const pool = getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT 
        d.DeliveryId, d.HarvestRequestId, d.RecipientName, d.PhoneNumber, d.DeliveryAddress,
        d.CarrierName, d.TrackingCode, d.ShippingFee, d.Status as DeliveryStatus,
        d.ShippedAt, d.DeliveredAt, d.ProofImageUrl,
        hr.HarvestType, hr.RequestDate, hr.CustomerNote,
        c.CultivationId, p.PlotCode, s.SeedName, s.ExpectedYieldKgPerM2, p.SizeM2
      FROM Deliveries d
      JOIN HarvestRequests hr ON d.HarvestRequestId = hr.HarvestRequestId
      JOIN Cultivations c ON hr.CultivationId = c.CultivationId
      JOIN Plots p ON c.PlotId = p.PlotId
      JOIN Seeds s ON c.SeedId = s.SeedId
      WHERE hr.UserId = @UserId
      ORDER BY hr.RequestDate DESC
    `);
  return result.recordset;
};

module.exports = {
  getCultivationLogs,
  createCultivationLog,
  createCareRequest,
  getMyCareRequests,
  createHarvestRequest,
  getMyDeliveries,
};
