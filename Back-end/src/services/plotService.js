const { getPool, sql } = require('../config/db');
const { TABLES, PLOT_STATUS } = require('../models');

const getPlotGrid = async (filters = {}) => {
  const pool = getPool();
  let query = `
    SELECT p.PlotId, p.PlotCode, p.AreaId, fa.AreaName, p.RowNum, p.ColNum,
           p.SizeM2, p.SoilPH, p.StandardHumidity,
           p.BasePricePerMonth, p.Status, p.ReservedUntil, p.FallowingUntil
    FROM ${TABLES.PLOTS} p
    LEFT JOIN ${TABLES.FARM_AREAS} fa ON p.AreaId = fa.AreaId
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

  // Check current status (BR-01)
  const checkResult = await pool
    .request()
    .input('PlotId', sql.Int, plotId)
    .query(`SELECT Status, ReservedUntil FROM ${TABLES.PLOTS} WHERE PlotId = @PlotId`);

  if (checkResult.recordset.length === 0) {
    const error = new Error('Ô đất không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const plot = checkResult.recordset[0];
  const now = new Date();

  // Allow reserve if AVAILABLE or if previous reservation expired
  const isExpired = plot.ReservedUntil && new Date(plot.ReservedUntil) < now;
  if (plot.Status !== PLOT_STATUS.AVAILABLE && !(plot.Status === PLOT_STATUS.RESERVED && isExpired)) {
    const error = new Error(`Ô đất đang ở trạng thái ${plot.Status}, không thể giữ chỗ`);
    error.statusCode = 400;
    throw error;
  }

  // 15 minutes timeout (BR-10)
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  await pool
    .request()
    .input('PlotId', sql.Int, plotId)
    .input('ReservedUntil', sql.DateTime2(0), expiresAt)
    .input('ReservedByUserId', sql.Int, userId || null)
    .query(`
      UPDATE ${TABLES.PLOTS}
      SET Status = 'RESERVED', ReservedUntil = @ReservedUntil, ReservedByUserId = @ReservedByUserId
      WHERE PlotId = @PlotId
    `);

  return {
    plotId,
    status: PLOT_STATUS.RESERVED,
    reservedUntil: expiresAt,
    expiresInMinutes: 15,
  };
};

module.exports = {
  getPlotGrid,
  reservePlot,
};
