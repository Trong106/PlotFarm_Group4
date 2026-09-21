const { getPool, sql } = require('../config/db');
const { TABLES, PLOT_STATUS } = require('../models');

const getPlotGrid = async (filters = {}) => {
  const pool = getPool();

  // Tự động giải phóng các ô đất đã hết hạn giữ chỗ 15 phút (BR-10)
  try {
    await pool.request().query(`
      UPDATE ${TABLES.PLOTS}
      SET Status = 'AVAILABLE', ReservedUntil = NULL, ReservedByUserId = NULL
      WHERE Status = 'RESERVED' AND ReservedUntil IS NOT NULL AND ReservedUntil < SYSDATETIME()
    `);
  } catch (cleanErr) {
    console.warn('[PlotService] Auto-cleanup expired reservations warning:', cleanErr.message);
  }

  let query = `
    SELECT p.PlotId, p.PlotCode, p.AreaId, fa.AreaName, p.RowNum, p.ColNum,
           p.SizeM2, p.SoilPH, p.StandardHumidity,
           p.BasePricePerMonth, p.Status, p.ReservedUntil, p.FallowingUntil,
           p.CameraId, cam.CameraCode, cam.CameraName, cam.Status as CameraStatus,
           CAST(CASE WHEN EXISTS (
             SELECT 1 FROM ${TABLES.CULTIVATIONS} c
             WHERE c.PlotId = p.PlotId
               AND c.Status IN ('PLANTING', 'GROWING', 'READY_TO_HARVEST')
           ) THEN 1 ELSE 0 END AS BIT) AS HasActiveCultivation
    FROM ${TABLES.PLOTS} p
    LEFT JOIN ${TABLES.FARM_AREAS} fa ON p.AreaId = fa.AreaId
    LEFT JOIN Cameras cam ON p.CameraId = cam.CameraId
    WHERE 1=1
  `;

  if (filters.status) {
    query += ` AND p.Status = @Status`;
  }
  if (filters.areaId) {
    query += ` AND p.AreaId = @AreaId`;
  }

  query += ` ORDER BY p.RowNum ASC, p.ColNum ASC`;

  const request = pool.request();
  if (filters.status) request.input('Status', sql.NVarChar(30), filters.status);
  if (filters.areaId) request.input('AreaId', sql.Int, filters.areaId);

  const result = await request.query(query);
  return result.recordset;
};

const reservePlot = async (plotId, userId) => {
  const pool = getPool();

  // Tự động dọn dẹp các ô đất đã hết hạn giữ chỗ trước khi kiểm tra (BR-10)
  try {
    await pool.request().query(`
      UPDATE ${TABLES.PLOTS}
      SET Status = 'AVAILABLE', ReservedUntil = NULL, ReservedByUserId = NULL
      WHERE Status = 'RESERVED' AND ReservedUntil IS NOT NULL AND ReservedUntil < SYSDATETIME()
    `);
  } catch (e) {
    // Non-fatal
  }

  // Check current status
  const checkResult = await pool
    .request()
    .input('PlotId', sql.Int, plotId)
    .query(`
      SELECT PlotId, PlotCode, Status, ReservedUntil, ReservedByUserId,
             CAST(CASE WHEN ReservedUntil IS NOT NULL AND ReservedUntil < SYSDATETIME() THEN 1 ELSE 0 END AS BIT) AS IsExpired
      FROM ${TABLES.PLOTS}
      WHERE PlotId = @PlotId
    `);

  if (checkResult.recordset.length === 0) {
    const error = new Error('Ô đất không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const plot = checkResult.recordset[0];
  const isExpired = Boolean(plot.IsExpired);
  const isReservedByMe = plot.Status === PLOT_STATUS.RESERVED && plot.ReservedByUserId && Number(plot.ReservedByUserId) === Number(userId);

  if (plot.Status !== PLOT_STATUS.AVAILABLE && !isExpired && !isReservedByMe) {
    const error = new Error(`Ô đất ${plot.PlotCode || ''} đang có khách hàng khác giữ chỗ độc quyền trong 15 phút. Vui lòng chọn ô đất khác hoặc chờ lượt kế tiếp.`);
    error.statusCode = 409;
    throw error;
  }

  // Khóa độc quyền 15 phút theo giờ hệ thống SQL Server (BR-10)
  const updateResult = await pool
    .request()
    .input('PlotId', sql.Int, plotId)
    .input('ReservedByUserId', sql.Int, userId || null)
    .query(`
      UPDATE ${TABLES.PLOTS}
      SET Status = 'RESERVED',
          ReservedUntil = DATEADD(minute, 15, SYSDATETIME()),
          ReservedByUserId = @ReservedByUserId
      OUTPUT INSERTED.PlotId, INSERTED.PlotCode, INSERTED.Status, INSERTED.ReservedUntil
      WHERE PlotId = @PlotId
    `);

  const updated = updateResult.recordset[0];

  return {
    plotId: updated.PlotId,
    plotCode: updated.PlotCode,
    status: PLOT_STATUS.RESERVED,
    reservedUntil: updated.ReservedUntil,
    expiresInMinutes: 15,
  };
};

const releasePlot = async (plotId, userId) => {
  const pool = getPool();
  await pool
    .request()
    .input('PlotId', sql.Int, plotId)
    .input('UserId', sql.Int, userId || null)
    .query(`
      UPDATE ${TABLES.PLOTS}
      SET Status = 'AVAILABLE', ReservedUntil = NULL, ReservedByUserId = NULL
      WHERE PlotId = @PlotId
        AND Status = 'RESERVED'
        AND (ReservedByUserId = @UserId OR @UserId IS NULL OR ReservedUntil < SYSDATETIME())
    `);

  return {
    plotId,
    status: PLOT_STATUS.AVAILABLE,
  };
};

/**
 * Admin cập nhật trạng thái ô đất
 */
const updatePlotStatus = async (plotId, newStatus) => {
  const allowedStatuses = ['AVAILABLE', 'MAINTENANCE', 'FALLOWING', 'RENTED'];
  if (!allowedStatuses.includes(newStatus)) {
    const err = new Error(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${allowedStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const pool = getPool();
  const result = await pool.request()
    .input('PlotId', sql.Int, plotId)
    .input('Status', sql.NVarChar(30), newStatus)
    .query(`
      UPDATE Plots
      SET Status = @Status,
          ReservedUntil = CASE WHEN @Status = 'AVAILABLE' THEN NULL ELSE ReservedUntil END,
          ReservedByUserId = CASE WHEN @Status = 'AVAILABLE' THEN NULL ELSE ReservedByUserId END,
          UpdatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE PlotId = @PlotId
    `);

  if (result.recordset.length === 0) {
    const err = new Error('Không tìm thấy ô đất');
    err.statusCode = 404;
    throw err;
  }

  return result.recordset[0];
};

const getAreas = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT AreaId, FarmId, AreaCode, AreaName, SoilType, TotalPlots, Description
    FROM FarmAreas
    ORDER BY AreaId ASC
  `);
  return result.recordset;
};

module.exports = {
  getAreas,
  getPlotGrid,
  reservePlot,
  releasePlot,
  updatePlotStatus,
};
