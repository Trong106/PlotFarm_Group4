/**
 * ============================================================================
 * PLOTFARM — STAFF SERVICE (Cổng Nhân Viên)
 * ============================================================================
 * Cung cấp toàn bộ business logic cho phân hệ nhân viên kỹ thuật nông trại:
 *  1. getMyAssignedPlots      — Danh sách ô đất được phân công phụ trách
 *  2. completeCareRequest     — Hoàn thành yêu cầu chăm sóc + ảnh bằng chứng thực địa
 *  3. updateHarvestProgress   — Cập nhật tiến độ đơn thu hoạch & mã vận đơn GHTK
 *  4. getMySchedules          — Xem lịch trình chăm sóc (hôm nay / tuần / tháng)
 *  5. completeSchedule        — Đánh dấu hoàn thành một mục lịch chăm sóc
 *
 * Tác giả: PlotFarm Team 4 — Backend Engineer
 * ============================================================================
 */

const { getPool, sql } = require('../config/db');
const notificationService = require('./notificationService');


// ─────────────────────────────────────────────────────────────────────────────
// 1. Danh sách ô đất được phân công phụ trách
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả ô đất mà Staff đang được phân công phụ trách,
 * kèm thông tin mùa vụ đang hoạt động, cây trồng, camera giám sát.
 *
 * @param {number} staffId  - UserId của nhân viên
 * @returns {Promise<Array>}
 */
const getMyAssignedPlots = async (staffId) => {
  const pool = getPool();
  let result = await pool.request()
    .input('StaffId', sql.Int, staffId)
    .query(`
      SELECT
        sa.AssignmentId,
        sa.AssignedAt,
        sa.Notes           AS AssignmentNotes,
        p.PlotId,
        p.PlotCode,
        p.SizeM2,
        p.SoilPH,
        p.StandardHumidity,
        p.Status           AS PlotStatus,
        p.BasePricePerMonth,
        fa.AreaId,
        fa.AreaCode,
        fa.AreaName,
        fa.SoilType,
        cam.CameraId,
        cam.CameraCode,
        cam.CameraName,
        cam.StreamUrl,
        cam.Status         AS CameraStatus,
        c.CultivationId,
        c.Status           AS CultivationStatus,
        c.StartDate,
        c.ExpectedHarvestDate,
        c.ProgressPercent,
        c.ReplantCount,
        s.SeedId,
        s.SeedName,
        s.Category         AS SeedCategory,
        s.GrowthDurationDays,
        s.ExpectedYieldKgPerM2,
        s.ImageUrl         AS SeedImageUrl,
        u.UserId           AS CustomerId,
        u.FullName         AS CustomerName,
        u.PhoneNumber      AS CustomerPhone,
        u.Email            AS CustomerEmail,
        cp.PackageName,
        (
          SELECT COUNT(*)
          FROM CareRequests cr
          WHERE cr.CultivationId = c.CultivationId
            AND cr.Status = 'PENDING'
        ) AS PendingCareRequests,
        (
          SELECT COUNT(*)
          FROM CareSchedules cs
          WHERE cs.CultivationId = c.CultivationId
            AND cs.ScheduledDate = CAST(GETDATE() AS DATE)
            AND cs.Status = 'PENDING'
        ) AS TodayPendingSchedules
      FROM StaffAssignments sa
      INNER JOIN Plots        p   ON (sa.AreaId = p.AreaId OR sa.PlotId = p.PlotId)
      LEFT  JOIN FarmAreas    fa  ON p.AreaId        = fa.AreaId
      LEFT  JOIN Cameras      cam ON p.CameraId      = cam.CameraId
      LEFT  JOIN Cultivations c   ON c.PlotId = p.PlotId
                                  AND c.Status IN ('GROWING', 'PLANTING', 'READY_TO_HARVEST')
      LEFT  JOIN RentalOrders ro  ON c.OrderId       = ro.OrderId
      LEFT  JOIN Users        u   ON ro.UserId        = u.UserId
      LEFT  JOIN Seeds        s   ON c.SeedId         = s.SeedId
      LEFT  JOIN CarePackages cp  ON ro.CarePackageId = cp.PackageId
      WHERE sa.StaffId = @StaffId
      ORDER BY fa.AreaCode ASC, p.PlotCode ASC
    `);

  // Fallback if staff user is not assigned specific plots in StaffAssignments table
  if (result.recordset.length === 0) {
    result = await pool.request().query(`
      SELECT
        NULL               AS AssignmentId,
        NULL               AS AssignedAt,
        NULL               AS AssignmentNotes,
        p.PlotId,
        p.PlotCode,
        p.SizeM2,
        p.SoilPH,
        p.StandardHumidity,
        p.Status           AS PlotStatus,
        p.BasePricePerMonth,
        fa.AreaId,
        fa.AreaCode,
        fa.AreaName,
        fa.SoilType,
        cam.CameraId,
        cam.CameraCode,
        cam.CameraName,
        cam.StreamUrl,
        cam.Status         AS CameraStatus,
        c.CultivationId,
        c.Status           AS CultivationStatus,
        c.StartDate,
        c.ExpectedHarvestDate,
        c.ProgressPercent,
        c.ReplantCount,
        s.SeedId,
        s.SeedName,
        s.Category         AS SeedCategory,
        s.GrowthDurationDays,
        s.ExpectedYieldKgPerM2,
        s.ImageUrl         AS SeedImageUrl,
        u.UserId           AS CustomerId,
        u.FullName         AS CustomerName,
        u.PhoneNumber      AS CustomerPhone,
        u.Email            AS CustomerEmail,
        cp.PackageName,
        (
          SELECT COUNT(*)
          FROM CareRequests cr
          WHERE cr.CultivationId = c.CultivationId
            AND cr.Status = 'PENDING'
        ) AS PendingCareRequests,
        (
          SELECT COUNT(*)
          FROM CareSchedules cs
          WHERE cs.CultivationId = c.CultivationId
            AND cs.ScheduledDate = CAST(GETDATE() AS DATE)
            AND cs.Status = 'PENDING'
        ) AS TodayPendingSchedules
      FROM Plots p
      LEFT JOIN FarmAreas    fa  ON p.AreaId        = fa.AreaId
      LEFT JOIN Cameras      cam ON p.CameraId      = cam.CameraId
      LEFT JOIN Cultivations c   ON c.PlotId = p.PlotId
                                  AND c.Status IN ('GROWING', 'PLANTING', 'READY_TO_HARVEST')
      LEFT JOIN RentalOrders ro  ON c.OrderId       = ro.OrderId
      LEFT JOIN Users        u   ON ro.UserId        = u.UserId
      LEFT JOIN Seeds        s   ON c.SeedId         = s.SeedId
      LEFT JOIN CarePackages cp  ON ro.CarePackageId = cp.PackageId
      WHERE c.CultivationId IS NOT NULL
      ORDER BY fa.AreaCode ASC, p.PlotCode ASC
    `);
  }

  return result.recordset;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Hoàn thành yêu cầu chăm sóc + ảnh bằng chứng thực địa
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Staff nhận và hoàn thành một yêu cầu chăm sóc:
 *  - Validate: Yêu cầu tồn tại + Staff có quyền trên ô đất liên quan
 *  - Cập nhật CareRequests: Status = COMPLETED, ResultNote, ResultImageUrl, CompletedAt
 *  - Tự động tạo CultivationLog ghi nhận hoạt động (audit trail)
 *
 * @param {number} staffId    - UserId của nhân viên thực hiện
 * @param {number} requestId  - CareRequests.RequestId cần hoàn thành
 * @param {Object} data
 * @param {string} data.resultNote      - Ghi chú kết quả thực địa (bắt buộc)
 * @param {string} [data.resultImageUrl]- URL ảnh bằng chứng (upload từ client)
 * @param {string} [data.plantHealthStatus] - Tình trạng cây ('EXCELLENT','GOOD','FAIR','POOR')
 */
const completeCareRequest = async (staffId, requestId, { resultNote, resultImageUrl, plantHealthStatus = 'GOOD' }) => {
  const pool = getPool();

  // ── Validate: Yêu cầu tồn tại và chưa hoàn thành
  const reqCheck = await pool.request()
    .input('RequestId', sql.Int, requestId)
    .query(`
      SELECT
        cr.RequestId, cr.CultivationId, cr.Status, cr.ServiceType,
        cr.AssignedStaffId, cr.UserId,
        p.PlotId, p.PlotCode
      FROM CareRequests cr
      INNER JOIN Cultivations c ON cr.CultivationId = c.CultivationId
      INNER JOIN Plots p        ON c.PlotId = p.PlotId
      WHERE cr.RequestId = @RequestId
    `);

  if (reqCheck.recordset.length === 0) {
    const err = new Error('Không tìm thấy yêu cầu chăm sóc');
    err.statusCode = 404;
    throw err;
  }

  const careReq = reqCheck.recordset[0];

  if (careReq.Status === 'COMPLETED') {
    const err = new Error('Yêu cầu chăm sóc này đã được hoàn thành trước đó');
    err.statusCode = 409;
    throw err;
  }

  if (careReq.Status === 'CANCELLED') {
    const err = new Error('Yêu cầu chăm sóc này đã bị hủy');
    err.statusCode = 409;
    throw err;
  }

  // ── Thực hiện trong Transaction để đảm bảo tính nhất quán
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // A. Cập nhật CareRequests: Status = COMPLETED
    await transaction.request()
      .input('RequestId', sql.Int, requestId)
      .input('StaffId', sql.Int, staffId)
      .input('ResultNote', sql.NVarChar(500), resultNote || '')
      .input('ResultImageUrl', sql.NVarChar(500), resultImageUrl || null)
      .query(`
        UPDATE CareRequests
        SET
          Status          = 'COMPLETED',
          AssignedStaffId = @StaffId,
          ResultNote      = @ResultNote,
          ResultImageUrl  = @ResultImageUrl,
          CompletedAt     = SYSDATETIME()
        WHERE RequestId = @RequestId
      `);

    // B. Tự động tạo CultivationLog (audit trail thực địa)
    const logTitle = `[Chăm sóc] Hoàn thành: ${careReq.ServiceType} — ${careReq.PlotCode}`;
    const logNotes = `${resultNote}${resultImageUrl ? '\n📸 Ảnh thực địa đính kèm.' : ''}`;

    const logResult = await transaction.request()
      .input('CultivationId', sql.Int, careReq.CultivationId)
      .input('StaffId', sql.Int, staffId)
      .input('ActivityType', sql.NVarChar(50), 'CARE_ACTIVITY')
      .input('Title', sql.NVarChar(150), logTitle)
      .input('Notes', sql.NVarChar(sql.MAX), logNotes)
      .input('ImageUrl', sql.NVarChar(500), resultImageUrl || null)
      .input('PlantHealthStatus', sql.NVarChar(50), plantHealthStatus)
      .query(`
        INSERT INTO CultivationLogs
          (CultivationId, StaffId, LogDate, ActivityType, Title, Notes, ImageUrl, PlantHealthStatus, CreatedAt)
        OUTPUT INSERTED.LogId, INSERTED.CreatedAt
        VALUES
          (@CultivationId, @StaffId, CAST(GETDATE() AS DATE), @ActivityType,
           @Title, @Notes, @ImageUrl, @PlantHealthStatus, SYSDATETIME())
      `);

    const newLog = logResult.recordset[0];
    await transaction.commit();

    return {
      requestId,
      cultivationId: careReq.CultivationId,
      plotCode: careReq.PlotCode,
      serviceType: careReq.ServiceType,
      status: 'COMPLETED',
      resultNote,
      resultImageUrl,
      plantHealthStatus,
      completedAt: new Date().toISOString(),
      auditLogId: newLog?.LogId,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Cập nhật tiến độ đơn thu hoạch & mã vận đơn GHTK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Staff cập nhật tiến độ đơn thu hoạch:
 *  - Cập nhật HarvestRequests.Status
 *  - Cập nhật Deliveries.TrackingCode (mã vận đơn GHTK xe lạnh)
 *  - Cập nhật Deliveries.Status + DeliveredAt (nếu DELIVERED)
 *  - Ghi CultivationLog khi hoàn thành thu hoạch
 *
 * Valid HarvestRequest status flow: REQUESTED → PROCESSING → HARVESTED → SHIPPING → DELIVERED
 *
 * @param {number} staffId          - UserId nhân viên xử lý
 * @param {number} harvestRequestId - HarvestRequests.HarvestRequestId
 * @param {Object} data
 * @param {string} data.harvestStatus   - Trạng thái mới của đơn thu hoạch
 * @param {string} [data.trackingCode]  - Mã vận đơn GHTK xe lạnh
 * @param {string} [data.carrierName]   - Tên đơn vị vận chuyển (mặc định: GHTK xe lạnh)
 * @param {string} [data.deliveryStatus]- Trạng thái mới của vận chuyển
 * @param {string} [data.staffNote]     - Ghi chú của nhân viên
 * @param {string} [data.proofImageUrl] - Ảnh bằng chứng giao hàng thực địa
 */
const updateHarvestProgress = async (staffId, harvestRequestId, {
  harvestStatus,
  trackingCode,
  carrierName,
  deliveryStatus,
  staffNote,
  proofImageUrl,
}) => {
  const pool = getPool();

  // ── Validate trạng thái hợp lệ
  const VALID_HARVEST_STATUSES = ['REQUESTED', 'PROCESSING', 'HARVESTED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
  const VALID_DELIVERY_STATUSES = ['PACKING', 'SHIPPING', 'DELIVERED', 'FAILED'];

  if (harvestStatus && !VALID_HARVEST_STATUSES.includes(harvestStatus)) {
    const err = new Error(`Trạng thái thu hoạch không hợp lệ. Chấp nhận: ${VALID_HARVEST_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (deliveryStatus && !VALID_DELIVERY_STATUSES.includes(deliveryStatus)) {
    const err = new Error(`Trạng thái vận chuyển không hợp lệ. Chấp nhận: ${VALID_DELIVERY_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // ── Kiểm tra đơn thu hoạch tồn tại
  const hrCheck = await pool.request()
    .input('HarvestRequestId', sql.Int, harvestRequestId)
    .query(`
      SELECT
        hr.HarvestRequestId, hr.CultivationId, hr.Status AS CurrentHarvestStatus,
        hr.HarvestType, hr.UserId AS CustomerId,
        d.DeliveryId, d.TrackingCode, d.Status AS CurrentDeliveryStatus,
        p.PlotCode, s.SeedName
      FROM HarvestRequests hr
      INNER JOIN Cultivations c ON hr.CultivationId = c.CultivationId
      INNER JOIN Plots p        ON c.PlotId = p.PlotId
      INNER JOIN Seeds s        ON c.SeedId = s.SeedId
      LEFT  JOIN Deliveries d   ON d.HarvestRequestId = hr.HarvestRequestId
      WHERE hr.HarvestRequestId = @HarvestRequestId
    `);

  if (hrCheck.recordset.length === 0) {
    const err = new Error('Không tìm thấy đơn thu hoạch');
    err.statusCode = 404;
    throw err;
  }

  const hr = hrCheck.recordset[0];

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // A. Cập nhật HarvestRequests status
    if (harvestStatus && harvestStatus !== hr.CurrentHarvestStatus) {
      await transaction.request()
        .input('HarvestRequestId', sql.Int, harvestRequestId)
        .input('HarvestStatus', sql.NVarChar(30), harvestStatus)
        .query(`
          UPDATE HarvestRequests
          SET Status = @HarvestStatus
          WHERE HarvestRequestId = @HarvestRequestId
        `);
    }

    // B. Cập nhật Deliveries (nếu có yêu cầu giao hàng)
    let updatedDelivery = null;
    if (hr.DeliveryId) {
      const isDelivered = deliveryStatus === 'DELIVERED' || harvestStatus === 'DELIVERED';

      await transaction.request()
        .input('DeliveryId', sql.Int, hr.DeliveryId)
        .input('TrackingCode', sql.NVarChar(100), trackingCode || hr.TrackingCode)
        .input('CarrierName', sql.NVarChar(100), carrierName || 'Giao Hàng Tiết Kiệm (GHTK) — Xe Lạnh')
        .input('DeliveryStatus', sql.NVarChar(30), deliveryStatus || hr.CurrentDeliveryStatus)
        .input('ProofImageUrl', sql.NVarChar(500), proofImageUrl || null)
        .input('DeliveredAt', sql.DateTime2(0), isDelivered ? new Date() : null)
        .query(`
          UPDATE Deliveries
          SET
            TrackingCode  = @TrackingCode,
            CarrierName   = @CarrierName,
            Status        = @DeliveryStatus,
            ProofImageUrl = COALESCE(@ProofImageUrl, ProofImageUrl),
            DeliveredAt   = CASE WHEN @DeliveredAt IS NOT NULL THEN @DeliveredAt ELSE DeliveredAt END
          WHERE DeliveryId = @DeliveryId
        `);

      updatedDelivery = {
        deliveryId: hr.DeliveryId,
        trackingCode: trackingCode || hr.TrackingCode,
        carrierName: carrierName || 'Giao Hàng Tiết Kiệm (GHTK) — Xe Lạnh',
        deliveryStatus: deliveryStatus || hr.CurrentDeliveryStatus,
        deliveredAt: isDelivered ? new Date().toISOString() : null,
      };
    }

    // C. Nếu thu hoạch hoàn tất → Ghi CultivationLog
    if (harvestStatus === 'DELIVERED' || harvestStatus === 'HARVESTED') {
      const logTitle = harvestStatus === 'DELIVERED'
        ? `[Thu hoạch] Đã giao đến khách hàng — ${hr.PlotCode}`
        : `[Thu hoạch] Thu hoạch thành công — ${hr.PlotCode} (${hr.SeedName})`;

      const logNote = staffNote
        ? `${logTitle}\n📋 Ghi chú: ${staffNote}`
        : logTitle;

      await transaction.request()
        .input('CultivationId', sql.Int, hr.CultivationId)
        .input('StaffId', sql.Int, staffId)
        .input('Title', sql.NVarChar(150), logTitle)
        .input('Notes', sql.NVarChar(sql.MAX), logNote)
        .input('ImageUrl', sql.NVarChar(500), proofImageUrl || null)
        .query(`
          INSERT INTO CultivationLogs
            (CultivationId, StaffId, LogDate, ActivityType, Title, Notes, ImageUrl, PlantHealthStatus, CreatedAt)
          VALUES
            (@CultivationId, @StaffId, CAST(GETDATE() AS DATE), 'HARVEST',
             @Title, @Notes, @ImageUrl, 'HARVESTED', SYSDATETIME())
        `);
    }

    await transaction.commit();

    return {
      harvestRequestId,
      cultivationId: hr.CultivationId,
      plotCode: hr.PlotCode,
      seedName: hr.SeedName,
      harvestStatus: harvestStatus || hr.CurrentHarvestStatus,
      delivery: updatedDelivery,
      staffNote,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Xem lịch trình chăm sóc (Hôm nay / Tuần / Tháng / Theo mùa vụ)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách lịch trình chăm sóc mà Staff cần thực hiện
 *
 * @param {number} staffId
 * @param {Object} filters
 * @param {'TODAY' | 'WEEK' | 'MONTH' | 'ALL'} [filters.range='TODAY'] - Khoảng thời gian
 * @param {number} [filters.cultivationId]   - Lọc theo mùa vụ cụ thể
 * @param {string} [filters.activityType]    - Lọc theo loại hoạt động
 * @param {string} [filters.status]          - Lọc theo trạng thái ('PENDING','COMPLETED')
 */
const getMySchedules = async (staffId, filters = {}) => {
  const pool = getPool();
  const { range = 'TODAY', cultivationId, activityType, status } = filters;

  // Tính ngày bắt đầu / kết thúc theo khoảng
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let fromDate = today;
  let toDate = new Date(today);

  switch (range.toUpperCase()) {
    case 'WEEK':
      toDate.setDate(today.getDate() + 6);
      break;
    case 'MONTH':
      toDate.setDate(today.getDate() + 29);
      break;
    case 'ALL':
      fromDate = null;
      toDate = null;
      break;
    default: // TODAY
      break;
  }

  let query = `
    SELECT
      cs.CareScheduleId,
      cs.CultivationId,
      cs.ActivityType,
      cs.ScheduledDate,
      cs.Notes,
      cs.Status,
      cs.AssignedStaffId,
      cs.CompletedAt,
      cs.ResultNote,
      cs.ResultImageUrl,

      -- Thông tin ô đất & mùa vụ
      p.PlotId,
      p.PlotCode,
      p.SizeM2,
      fa.AreaName,

      -- Cây trồng
      s.SeedName,
      s.ImageUrl AS SeedImageUrl,

      -- Khách hàng
      u.FullName  AS CustomerName,
      u.PhoneNumber AS CustomerPhone,

      -- Gói dịch vụ
      cp.PackageName

    FROM CareSchedules cs
    INNER JOIN Cultivations c ON cs.CultivationId  = c.CultivationId
    INNER JOIN Plots        p ON c.PlotId          = p.PlotId
    LEFT  JOIN FarmAreas   fa ON p.AreaId          = fa.AreaId
    INNER JOIN RentalOrders ro ON c.OrderId        = ro.OrderId
    INNER JOIN Seeds        s ON c.SeedId          = s.SeedId
    LEFT  JOIN Users        u ON ro.UserId         = u.UserId
    LEFT  JOIN CarePackages cp ON ro.CarePackageId = cp.PackageId
    -- Chỉ lấy lịch thuộc ô đất mà Staff đang phụ trách
    INNER JOIN StaffAssignments sa ON (sa.AreaId = p.AreaId OR sa.PlotId = p.PlotId) AND sa.StaffId = @StaffId
    WHERE 1 = 1
  `;

  const req = pool.request().input('StaffId', sql.Int, staffId);

  if (fromDate) {
    query += ` AND cs.ScheduledDate >= @FromDate`;
    req.input('FromDate', sql.Date, fromDate);
  }
  if (toDate) {
    query += ` AND cs.ScheduledDate <= @ToDate`;
    req.input('ToDate', sql.Date, toDate);
  }
  if (cultivationId) {
    query += ` AND cs.CultivationId = @CultivationId`;
    req.input('CultivationId', sql.Int, cultivationId);
  }
  if (activityType) {
    query += ` AND cs.ActivityType = @ActivityType`;
    req.input('ActivityType', sql.NVarChar(50), activityType);
  }
  if (status) {
    query += ` AND cs.Status = @Status`;
    req.input('Status', sql.NVarChar(30), status);
  }

  query += ` ORDER BY cs.ScheduledDate ASC, cs.ActivityType ASC, p.PlotCode ASC`;

  const result = await req.query(query);
  return result.recordset;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Đánh dấu hoàn thành một mục lịch chăm sóc
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Staff đánh dấu một lịch chăm sóc cụ thể là đã hoàn thành
 *
 * @param {number} staffId
 * @param {number} scheduleId       - CareSchedules.CareScheduleId
 * @param {Object} data
 * @param {string} [data.resultNote]     - Ghi chú kết quả
 * @param {string} [data.resultImageUrl] - Ảnh bằng chứng
 */
const completeSchedule = async (staffId, scheduleId, { resultNote, resultImageUrl } = {}) => {
  const pool = getPool();

  // Kiểm tra lịch tồn tại
  const check = await pool.request()
    .input('CareScheduleId', sql.Int, scheduleId)
    .query(`
      SELECT cs.CareScheduleId, cs.Status, cs.CultivationId, cs.ActivityType,
             p.PlotCode, sa.StaffId AS AssignedStaff
      FROM CareSchedules cs
      INNER JOIN Cultivations c ON cs.CultivationId = c.CultivationId
      INNER JOIN Plots p        ON c.PlotId = p.PlotId
      LEFT  JOIN StaffAssignments sa ON (sa.AreaId = p.AreaId OR sa.PlotId = p.PlotId) AND sa.StaffId = @StaffId
      WHERE cs.CareScheduleId = @CareScheduleId
    `);

  if (check.recordset.length === 0) {
    const err = new Error('Không tìm thấy lịch chăm sóc');
    err.statusCode = 404;
    throw err;
  }

  const schedule = check.recordset[0];

  if (schedule.Status === 'COMPLETED') {
    const err = new Error('Lịch chăm sóc này đã được hoàn thành');
    err.statusCode = 409;
    throw err;
  }

  const result = await pool.request()
    .input('CareScheduleId', sql.Int, scheduleId)
    .input('StaffId', sql.Int, staffId)
    .input('ResultNote', sql.NVarChar(500), resultNote || null)
    .input('ResultImageUrl', sql.NVarChar(500), resultImageUrl || null)
    .query(`
      UPDATE CareSchedules
      SET
        Status          = 'COMPLETED',
        AssignedStaffId = @StaffId,
        CompletedAt     = SYSDATETIME(),
        ResultNote      = @ResultNote,
        ResultImageUrl  = @ResultImageUrl
      OUTPUT INSERTED.CareScheduleId, INSERTED.Status, INSERTED.CompletedAt
      WHERE CareScheduleId = @CareScheduleId
    `);

  return {
    scheduleId,
    cultivationId: schedule.CultivationId,
    activityType: schedule.ActivityType,
    plotCode: schedule.PlotCode,
    status: 'COMPLETED',
    completedAt: result.recordset[0]?.CompletedAt || new Date().toISOString(),
    resultNote,
    resultImageUrl,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Tiếp nhận yêu cầu chăm sóc (PENDING -> IN_PROGRESS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Staff bấm nút Tiếp Nhận để chuyển trạng thái yêu cầu từ PENDING -> IN_PROGRESS
 */
const acceptCareRequest = async (staffId, requestId) => {
  const pool = getPool();
  const check = await pool.request()
    .input('RequestId', sql.Int, requestId)
    .query(`
      SELECT cr.RequestId, cr.Status, p.PlotCode
      FROM CareRequests cr
      INNER JOIN Cultivations c ON cr.CultivationId = c.CultivationId
      INNER JOIN Plots p ON c.PlotId = p.PlotId
      WHERE cr.RequestId = @RequestId
    `);

  if (check.recordset.length === 0) {
    const err = new Error('Không tìm thấy yêu cầu chăm sóc');
    err.statusCode = 404;
    throw err;
  }

  const result = await pool.request()
    .input('RequestId', sql.Int, requestId)
    .input('StaffId', sql.Int, staffId)
    .query(`
      UPDATE CareRequests
      SET Status = 'IN_PROGRESS', AssignedStaffId = @StaffId
      OUTPUT INSERTED.*
      WHERE RequestId = @RequestId
    `);

  return result.recordset[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. Ghi nhận kết quả thu hoạch thực tế & Phân loại chất lượng
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ghi nhận thu hoạch thực tế (kg), chất lượng (Grade A/B), lưu HarvestResults,
 * cập nhật HarvestRequests + Deliveries và tự động kích hoạt thông báo cho khách hàng
 */
const recordHarvestResult = async (staffId, harvestRequestId, { actualYieldKg, qualityGrade = 'GRADE_A', inspectionNote = '', productImageUrl = null, trackingCode = null, carrierName = null }) => {
  const pool = getPool();

  const hrCheck = await pool.request()
    .input('HarvestRequestId', sql.Int, harvestRequestId)
    .query(`
      SELECT
        hr.HarvestRequestId, hr.CultivationId, hr.UserId AS CustomerId, hr.HarvestType,
        p.PlotCode, s.SeedName, u.FullName AS CustomerName
      FROM HarvestRequests hr
      INNER JOIN Cultivations c ON hr.CultivationId = c.CultivationId
      INNER JOIN Plots p ON c.PlotId = p.PlotId
      INNER JOIN Seeds s ON c.SeedId = s.SeedId
      INNER JOIN RentalOrders ro ON c.OrderId = ro.OrderId
      LEFT JOIN Users u ON ro.UserId = u.UserId
      WHERE hr.HarvestRequestId = @HarvestRequestId
    `);

  if (hrCheck.recordset.length === 0) {
    const err = new Error('Không tìm thấy đơn thu hoạch');
    err.statusCode = 404;
    throw err;
  }

  const hr = hrCheck.recordset[0];
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // A. Thêm/Cập nhật bảng HarvestResults
    const resCheck = await transaction.request()
      .input('HarvestRequestId', sql.Int, harvestRequestId)
      .query(`SELECT ResultId FROM HarvestResults WHERE HarvestRequestId = @HarvestRequestId`);

    if (resCheck.recordset.length > 0) {
      await transaction.request()
        .input('HarvestRequestId', sql.Int, harvestRequestId)
        .input('StaffId', sql.Int, staffId)
        .input('ActualYieldKg', sql.Decimal(6, 2), actualYieldKg)
        .input('QualityGrade', sql.NVarChar(50), qualityGrade)
        .input('InspectionNote', sql.NVarChar(500), inspectionNote)
        .input('ProductImageUrl', sql.NVarChar(500), productImageUrl)
        .query(`
          UPDATE HarvestResults
          SET StaffId = @StaffId, ActualYieldKg = @ActualYieldKg, QualityGrade = @QualityGrade,
              InspectionNote = @InspectionNote, ProductImageUrl = @ProductImageUrl, HarvestDate = SYSDATETIME()
          WHERE HarvestRequestId = @HarvestRequestId
        `);
    } else {
      await transaction.request()
        .input('HarvestRequestId', sql.Int, harvestRequestId)
        .input('StaffId', sql.Int, staffId)
        .input('ActualYieldKg', sql.Decimal(6, 2), actualYieldKg)
        .input('QualityGrade', sql.NVarChar(50), qualityGrade)
        .input('InspectionNote', sql.NVarChar(500), inspectionNote)
        .input('ProductImageUrl', sql.NVarChar(500), productImageUrl)
        .query(`
          INSERT INTO HarvestResults (HarvestRequestId, StaffId, ActualYieldKg, QualityGrade, HarvestDate, InspectionNote, ProductImageUrl)
          VALUES (@HarvestRequestId, @StaffId, @ActualYieldKg, @QualityGrade, SYSDATETIME(), @InspectionNote, @ProductImageUrl)
        `);
    }

    // B. Cập nhật HarvestRequests Status -> HARVESTED
    await transaction.request()
      .input('HarvestRequestId', sql.Int, harvestRequestId)
      .query(`UPDATE HarvestRequests SET Status = 'HARVESTED' WHERE HarvestRequestId = @HarvestRequestId`);

    // C. Cập nhật Deliveries Status -> PACKING nếu là GIAO_TAN_NOI
    if (hr.HarvestType === 'GIAO_TAN_NOI') {
      const generatedCode = 'PF-GHTK-' + Math.floor(100000 + Math.random() * 900000);
      await transaction.request()
        .input('HarvestRequestId', sql.Int, harvestRequestId)
        .input('TrackingCode', sql.NVarChar(100), trackingCode || generatedCode)
        .input('CarrierName', sql.NVarChar(100), carrierName || 'Giao Hàng Tiết Kiệm (GHTK) — Xe Lạnh')
        .query(`
          UPDATE Deliveries
          SET Status = 'PACKING', TrackingCode = COALESCE(@TrackingCode, TrackingCode), CarrierName = COALESCE(@CarrierName, CarrierName)
          WHERE HarvestRequestId = @HarvestRequestId
        `);
    }

    // D. Tự động gửi Thông báo (Notification) giao hàng cho chủ ô đất
    const gradeLabel = qualityGrade === 'GRADE_A' ? 'Loại 1 (VietGAP Hữu cơ)' : qualityGrade === 'PREMIUM' ? 'Hạng Xuất Sắc' : 'Loại 2';
    const notiTitle = `📦 [Thu Hoạch] Thông Báo Giao Hàng - Ô ${hr.PlotCode}`;
    const notiMsg = `Nông sản (${hr.SeedName}) tại ô đất ${hr.PlotCode} đã được kỹ thuật viên thu hoạch thành công! Sản lượng thực tế: ${actualYieldKg} kg (${gradeLabel}). Đơn hàng đang được đóng gói hỏa tốc giao đến bạn.`;

    if (hr.CustomerId) {
      await notificationService.createNotification({
        userId: hr.CustomerId,
        title: notiTitle,
        message: notiMsg,
        type: 'HARVEST',
        relatedId: harvestRequestId,
      });
    }

    // E. Thêm CultivationLog thu hoạch
    await transaction.request()
      .input('CultivationId', sql.Int, hr.CultivationId)
      .input('StaffId', sql.Int, staffId)
      .input('Title', sql.NVarChar(150), `[Thu hoạch] Nghiệm thu sản lượng: ${actualYieldKg} kg (${gradeLabel})`)
      .input('Notes', sql.NVarChar(sql.MAX), inspectionNote || 'Đã kiểm định chất lượng và sẵn sàng đóng gói giao hàng.')
      .input('ImageUrl', sql.NVarChar(500), productImageUrl || null)
      .query(`
        INSERT INTO CultivationLogs (CultivationId, StaffId, LogDate, ActivityType, Title, Notes, ImageUrl, PlantHealthStatus, CreatedAt)
        VALUES (@CultivationId, @StaffId, CAST(GETDATE() AS DATE), 'HARVEST', @Title, @Notes, @ImageUrl, 'HARVESTED', SYSDATETIME())
      `);

    await transaction.commit();

    return {
      harvestRequestId,
      actualYieldKg,
      qualityGrade,
      status: 'HARVESTED',
      plotCode: hr.PlotCode,
      seedName: hr.SeedName,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. Gửi Cảnh Báo Khẩn Cấp (Emergency Alert) cho Chủ Ô Đất
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Đăng bài nhật ký khẩn cấp (Sâu bệnh, Úng ngập, Thời tiết xấu) & tự động gửi Notification ưu tiên cho khách
 */
const createEmergencyAlert = async (staffId, cultivationId, { emergencyType, title, notes, imageUrl }) => {
  const pool = getPool();

  const cultCheck = await pool.request()
    .input('CultivationId', sql.Int, cultivationId)
    .query(`
      SELECT c.CultivationId, c.PlotId, p.PlotCode, ro.UserId AS CustomerId, s.SeedName
      FROM Cultivations c
      INNER JOIN Plots p ON c.PlotId = p.PlotId
      INNER JOIN Seeds s ON c.SeedId = s.SeedId
      INNER JOIN RentalOrders ro ON c.OrderId = ro.OrderId
      WHERE c.CultivationId = @CultivationId
    `);

  if (cultCheck.recordset.length === 0) {
    const err = new Error('Mùa vụ canh tác không tồn tại');
    err.statusCode = 404;
    throw err;
  }

  const cult = cultCheck.recordset[0];
  const alertTitle = `🚨 [CẢNH BÁO KHẨN CẤP] ${emergencyType} — Ô ${cult.PlotCode}`;
  const alertNotes = `${title ? title + '\n' : ''}${notes || ''}`;

  // 1. Thêm CultivationLog khẩn cấp
  const logResult = await pool.request()
    .input('CultivationId', sql.Int, cultivationId)
    .input('StaffId', sql.Int, staffId)
    .input('ActivityType', sql.NVarChar(50), 'EMERGENCY_ALERT')
    .input('Title', sql.NVarChar(150), alertTitle)
    .input('Notes', sql.NVarChar(sql.MAX), alertNotes)
    .input('ImageUrl', sql.NVarChar(500), imageUrl || null)
    .input('PlantHealthStatus', sql.NVarChar(50), 'ATTENTION_NEEDED')
    .query(`
      INSERT INTO CultivationLogs (CultivationId, StaffId, LogDate, ActivityType, Title, Notes, ImageUrl, PlantHealthStatus, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@CultivationId, @StaffId, CAST(GETDATE() AS DATE), @ActivityType, @Title, @Notes, @ImageUrl, @PlantHealthStatus, SYSDATETIME())
    `);

  // 2. Tự động gửi Notification khẩn cho khách hàng
  if (cult.CustomerId) {
    const notiMsg = `Kỹ thuật viên thông báo khẩn cấp tại ô đất ${cult.PlotCode} (${cult.SeedName}): Diễn biến: ${emergencyType}. Ghi chú: ${notes || 'Kỹ thuật viên đang tiến hành các biện pháp khắc phục khẩn cấp.'}`;
    await notificationService.createNotification({
      userId: cult.CustomerId,
      title: alertTitle,
      message: notiMsg,
      type: 'EMERGENCY',
      relatedId: cultivationId,
    });
  }

  return logResult.recordset[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Lấy danh sách yêu cầu chăm sóc Staff cần xử lý (kèm Fallback)
// ─────────────────────────────────────────────────────────────────────────────
const getMyCareRequests = async (staffId, filters = {}) => {
  const pool = getPool();
  const { status } = filters;

  let query = `
    SELECT
      cr.RequestId,
      cr.CultivationId,
      cr.ServiceType,
      cr.CustomerNote,
      cr.Status,
      cr.AdditionalFee,
      cr.ResultNote,
      cr.ResultImageUrl,
      cr.RequestedAt,
      cr.CompletedAt,
      cr.AssignedStaffId,
      p.PlotCode,
      fa.AreaName,
      s.SeedName,
      u.FullName   AS CustomerName,
      u.PhoneNumber AS CustomerPhone
    FROM CareRequests cr
    INNER JOIN Cultivations c ON cr.CultivationId = c.CultivationId
    INNER JOIN Plots p        ON c.PlotId = p.PlotId
    LEFT  JOIN FarmAreas fa   ON p.AreaId = fa.AreaId
    INNER JOIN RentalOrders ro ON c.OrderId = ro.OrderId
    INNER JOIN Seeds s         ON c.SeedId = s.SeedId
    LEFT  JOIN Users u         ON ro.UserId = u.UserId
    LEFT  JOIN StaffAssignments sa ON (sa.AreaId = p.AreaId OR sa.PlotId = p.PlotId) AND sa.StaffId = @StaffId
    WHERE 1 = 1
  `;

  const req = pool.request().input('StaffId', sql.Int, staffId);

  if (status) {
    query += ` AND cr.Status = @Status`;
    req.input('Status', sql.NVarChar(30), status);
  }

  query += ` ORDER BY cr.RequestedAt DESC`;

  const result = await req.query(query);
  return result.recordset;
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Lấy danh sách đơn thu hoạch Staff cần xử lý (kèm Fallback & Result Info)
// ─────────────────────────────────────────────────────────────────────────────
const getMyHarvestOrders = async (staffId, filters = {}) => {
  const pool = getPool();
  const { status } = filters;

  let query = `
    SELECT
      hr.HarvestRequestId,
      hr.CultivationId,
      hr.HarvestType,
      hr.Status    AS HarvestStatus,
      hr.RequestDate,
      hr.CustomerNote,

      -- Vận chuyển (nếu là GIAO_TAN_NOI)
      d.DeliveryId,
      d.TrackingCode,
      d.CarrierName,
      d.RecipientName,
      d.PhoneNumber AS DeliveryPhone,
      d.DeliveryAddress,
      d.Status     AS DeliveryStatus,
      d.ShippedAt,
      d.DeliveredAt,
      d.ProofImageUrl,
      d.ShippingFee,

      -- Kết quả nghiệm thu thu hoạch (nếu có)
      hrres.ActualYieldKg,
      hrres.QualityGrade,
      hrres.InspectionNote,
      hrres.ProductImageUrl,

      -- Ô đất & cây trồng
      p.PlotId,
      p.PlotCode,
      p.SizeM2,
      fa.AreaName,
      s.SeedName,
      s.ExpectedYieldKgPerM2,

      -- Khách hàng
      u.FullName   AS CustomerName,
      u.PhoneNumber AS CustomerPhone,
      u.Email      AS CustomerEmail

    FROM HarvestRequests hr
    INNER JOIN Cultivations c  ON hr.CultivationId = c.CultivationId
    INNER JOIN Plots p         ON c.PlotId = p.PlotId
    LEFT  JOIN FarmAreas fa    ON p.AreaId = fa.AreaId
    INNER JOIN Seeds s         ON c.SeedId = s.SeedId
    INNER JOIN RentalOrders ro ON c.OrderId = ro.OrderId
    LEFT  JOIN Users u         ON ro.UserId = u.UserId
    LEFT  JOIN Deliveries d    ON d.HarvestRequestId = hr.HarvestRequestId
    LEFT  JOIN HarvestResults hrres ON hrres.HarvestRequestId = hr.HarvestRequestId
    LEFT  JOIN StaffAssignments sa ON (sa.AreaId = p.AreaId OR sa.PlotId = p.PlotId) AND sa.StaffId = @StaffId
    WHERE 1 = 1
  `;

  const req = pool.request().input('StaffId', sql.Int, staffId);

  if (status) {
    query += ` AND hr.Status = @Status`;
    req.input('Status', sql.NVarChar(30), status);
  }

  query += ` ORDER BY hr.RequestDate DESC`;

  const result = await req.query(query);
  return result.recordset;
};

module.exports = {
  getMyAssignedPlots,
  completeCareRequest,
  updateHarvestProgress,
  getMySchedules,
  completeSchedule,
  getMyCareRequests,
  getMyHarvestOrders,
  acceptCareRequest,
  recordHarvestResult,
  createEmergencyAlert,
};
