/**
 * ============================================================================
 * PLOTFARM — CARE SCHEDULE AUTOMATION ENGINE
 * ============================================================================
 * Chức năng: Tự động sinh lịch trình chăm sóc dự kiến cho mỗi mùa vụ mới
 *            khi đơn thuê được kích hoạt thành công.
 *
 * Logic:
 *  - Gói "Cơ bản"    → Tưới 2 ngày/lần, Bón phân 14 ngày/lần, Không tỉa cành
 *  - Gói "Tiêu chuẩn"→ Tưới hàng ngày, Bón phân 10 ngày/lần, Tỉa cành 21 ngày/lần
 *  - Gói "Cao cấp"   → Tưới 2 lần/ngày (gộp), Bón phân 7 ngày/lần, Tỉa cành 14 ngày/lần
 *
 * Tác giả: PlotFarm Team 4 — Backend Engineer
 * ============================================================================
 */

const { getPool, sql } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Cấu hình lịch theo từng tier gói dịch vụ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chuẩn hóa tên gói dịch vụ về tier (BASIC / STANDARD / PREMIUM)
 * @param {string} packageName
 * @returns {'BASIC' | 'STANDARD' | 'PREMIUM'}
 */
const resolvePackageTier = (packageName) => {
  if (!packageName) return 'BASIC';
  const name = packageName.toLowerCase();
  if (name.includes('cao cấp') || name.includes('premium') || name.includes('vip')) return 'PREMIUM';
  if (name.includes('tiêu chuẩn') || name.includes('standard')) return 'STANDARD';
  return 'BASIC';
};

/**
 * Cấu hình tần suất chăm sóc theo gói dịch vụ (đơn vị: ngày)
 * intervalDays = null  → Không thực hiện hoạt động này
 * intervalDays = 1     → Hàng ngày
 */
const CARE_CONFIG = {
  BASIC: {
    WATERING: { intervalDays: 2, note: 'Tưới nước đúng lịch — Gói Cơ Bản' },
    FERTILIZING: { intervalDays: 14, note: 'Bón phân trùn quế — Gói Cơ Bản' },
    PRUNING: { intervalDays: null, note: null }, // Không có trong gói cơ bản
  },
  STANDARD: {
    WATERING: { intervalDays: 1, note: 'Tưới nước hàng ngày — Gói Tiêu Chuẩn' },
    FERTILIZING: { intervalDays: 10, note: 'Bón phân trùn quế — Gói Tiêu Chuẩn' },
    PRUNING: { intervalDays: 21, note: 'Tỉa cành, tạo tán — Gói Tiêu Chuẩn' },
  },
  PREMIUM: {
    WATERING: { intervalDays: 1, note: 'Tưới nước 2 lần/ngày (sáng + chiều) — Gói Cao Cấp' },
    FERTILIZING: { intervalDays: 7, note: 'Bón phân trùn quế định kỳ — Gói Cao Cấp' },
    PRUNING: { intervalDays: 14, note: 'Tỉa cành chuyên nghiệp — Gói Cao Cấp' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Cộng thêm N ngày vào một Date object
// ─────────────────────────────────────────────────────────────────────────────
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core: Sinh toàn bộ lịch chăm sóc dự kiến
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sinh lịch trình chăm sóc dự kiến và ghi vào bảng CareSchedules
 *
 * @param {Object} params
 * @param {number} params.cultivationId  - ID mùa vụ vừa được kích hoạt
 * @param {number} params.packageId      - ID gói dịch vụ đã mua
 * @param {string} params.packageName    - Tên gói dịch vụ (để xác định tier)
 * @param {Date}   params.startDate      - Ngày bắt đầu mùa vụ
 * @param {number} params.totalDays      - Tổng số ngày thuê
 * @param {object} [params.transaction]  - SQL Transaction (nếu gọi trong transaction)
 * @returns {Promise<{ generated: number, breakdown: object }>}
 */
const generateCareSchedule = async ({ cultivationId, packageId, packageName, startDate, totalDays, transaction }) => {
  const pool = getPool();
  const tier = resolvePackageTier(packageName);
  const config = CARE_CONFIG[tier];

  const scheduleRows = [];
  const breakdown = { WATERING: 0, FERTILIZING: 0, PRUNING: 0 };

  // Sinh lịch cho từng loại hoạt động
  for (const [activityType, cfg] of Object.entries(config)) {
    if (!cfg.intervalDays) continue; // Bỏ qua hoạt động không có trong gói

    let currentDate = addDays(startDate, cfg.intervalDays); // Bắt đầu từ N ngày sau startDate
    const endDate = addDays(startDate, totalDays);

    while (currentDate <= endDate) {
      scheduleRows.push({
        activityType,
        scheduledDate: new Date(currentDate),
        notes: cfg.note,
      });
      breakdown[activityType]++;
      currentDate = addDays(currentDate, cfg.intervalDays);
    }
  }

  if (scheduleRows.length === 0) {
    return { generated: 0, breakdown, tier };
  }

  // Ghi hàng loạt vào DB bằng bulk insert tối ưu
  // Dùng VALUES batch thay vì từng INSERT riêng lẻ để giảm round-trips
  const BATCH_SIZE = 50; // Chia thành các lô để tránh quá nhiều params trong 1 query
  let totalInserted = 0;

  for (let i = 0; i < scheduleRows.length; i += BATCH_SIZE) {
    const batch = scheduleRows.slice(i, i + BATCH_SIZE);

    const valueClauses = batch.map((_, idx) => {
      const base = i + idx;
      return `(@CultivationId, @PackageId, @ActivityType${base}, @ScheduledDate${base}, @Notes${base}, 'PENDING', SYSDATETIME())`;
    });

    const req = transaction ? transaction.request() : pool.request();
    req.input('CultivationId', sql.Int, cultivationId);
    req.input('PackageId', sql.Int, packageId || null);

    batch.forEach((row, idx) => {
      const base = i + idx;
      req.input(`ActivityType${base}`, sql.NVarChar(50), row.activityType);
      req.input(`ScheduledDate${base}`, sql.Date, row.scheduledDate);
      req.input(`Notes${base}`, sql.NVarChar(255), row.notes || null);
    });

    await req.query(`
      INSERT INTO CareSchedules (CultivationId, PackageId, ActivityType, ScheduledDate, Notes, Status, CreatedAt)
      VALUES ${valueClauses.join(',\n      ')}
    `);

    totalInserted += batch.length;
  }

  console.log(`[scheduleEngine] Đã sinh ${totalInserted} lịch chăm sóc (${tier}) cho Cultivation #${cultivationId}`);
  console.log(`[scheduleEngine] Phân loại: Tưới nước=${breakdown.WATERING}, Bón phân=${breakdown.FERTILIZING}, Tỉa cành=${breakdown.PRUNING}`);

  return {
    generated: totalInserted,
    breakdown,
    tier,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Lấy lịch chăm sóc theo filter (dùng cho Staff Portal)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lấy lịch chăm sóc của một mùa vụ cụ thể
 * @param {number} cultivationId
 * @param {{ status?: string, from?: Date, to?: Date }} filters
 */
const getCareSchedulesByCultivation = async (cultivationId, filters = {}) => {
  const pool = getPool();
  let query = `
    SELECT
      cs.CareScheduleId, cs.CultivationId, cs.PackageId,
      cs.ActivityType, cs.ScheduledDate, cs.Notes,
      cs.Status, cs.AssignedStaffId, cs.CompletedAt,
      cs.ResultNote, cs.ResultImageUrl, cs.CreatedAt,
      u.FullName AS AssignedStaffName
    FROM CareSchedules cs
    LEFT JOIN Users u ON cs.AssignedStaffId = u.UserId
    WHERE cs.CultivationId = @CultivationId
  `;
  const req = pool.request().input('CultivationId', sql.Int, cultivationId);

  if (filters.status) {
    query += ` AND cs.Status = @Status`;
    req.input('Status', sql.NVarChar(30), filters.status);
  }
  if (filters.from) {
    query += ` AND cs.ScheduledDate >= @FromDate`;
    req.input('FromDate', sql.Date, filters.from);
  }
  if (filters.to) {
    query += ` AND cs.ScheduledDate <= @ToDate`;
    req.input('ToDate', sql.Date, filters.to);
  }

  query += ` ORDER BY cs.ScheduledDate ASC, cs.ActivityType ASC`;
  const result = await req.query(query);
  return result.recordset;
};

module.exports = {
  generateCareSchedule,
  getCareSchedulesByCultivation,
  resolvePackageTier,
  CARE_CONFIG,
};
