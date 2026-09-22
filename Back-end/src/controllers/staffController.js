/**
 * ============================================================================
 * PLOTFARM — STAFF CONTROLLER (Cổng Nhân Viên)
 * ============================================================================
 * Xử lý HTTP requests cho toàn bộ API phục vụ phân hệ nhân viên kỹ thuật.
 * Tất cả endpoints yêu cầu xác thực JWT với vai trò Staff hoặc Admin.
 *
 * Tác giả: PlotFarm Team 4 — Backend Engineer
 * ============================================================================
 */

const staffService = require('../services/staffService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/my-plots
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Lấy danh sách ô đất được phân công phụ trách kèm thông tin mùa vụ đang hoạt động
 */
const getMyAssignedPlots = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const plots = await staffService.getMyAssignedPlots(staffId, userRole);
    return successResponse(
      res,
      plots,
      `Danh sách ${plots.length} ô đất được phân công phụ trách`
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/staff/care-requests/:id/complete
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Nhận và hoàn thành yêu cầu chăm sóc kèm ảnh bằng chứng thực địa
 *
 * Body: { resultNote, resultImageUrl?, plantHealthStatus? }
 */
const completeCareRequest = async (req, res, next) => {
  try {
    const staffId   = req.user?.userId;
    const userRole  = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId) || requestId <= 0) {
      return errorResponse(res, 'RequestId không hợp lệ', 400);
    }

    const { resultNote, resultImageUrl, plantHealthStatus } = req.body;
    if (!resultNote || resultNote.trim().length === 0) {
      return errorResponse(res, 'Ghi chú kết quả thực địa là bắt buộc (resultNote)', 400);
    }

    const VALID_HEALTH = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
    if (plantHealthStatus && !VALID_HEALTH.includes(plantHealthStatus)) {
      return errorResponse(
        res,
        `Tình trạng cây không hợp lệ. Chấp nhận: ${VALID_HEALTH.join(', ')}`,
        400
      );
    }

    const result = await staffService.completeCareRequest(staffId, requestId, {
      resultNote: resultNote.trim(),
      resultImageUrl: resultImageUrl || null,
      plantHealthStatus: plantHealthStatus || 'GOOD',
    }, userRole);

    return successResponse(
      res,
      result,
      `Đã hoàn thành yêu cầu chăm sóc #${requestId}. Nhật ký thực địa đã được lưu.`,
      200
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/staff/harvest-orders/:id/progress
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Cập nhật tiến độ đơn thu hoạch & lưu mã vận đơn GHTK xe lạnh
 *
 * Body: { harvestStatus?, trackingCode?, carrierName?, deliveryStatus?, staffNote?, proofImageUrl? }
 */
const updateHarvestProgress = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const harvestRequestId = parseInt(req.params.id, 10);
    if (isNaN(harvestRequestId) || harvestRequestId <= 0) {
      return errorResponse(res, 'HarvestRequestId không hợp lệ', 400);
    }

    const { harvestStatus, trackingCode, carrierName, deliveryStatus, staffNote, proofImageUrl } = req.body;

    // Phải có ít nhất một trường cập nhật
    if (!harvestStatus && !trackingCode && !deliveryStatus && !staffNote) {
      return errorResponse(
        res,
        'Vui lòng cung cấp ít nhất một trong các thông tin cần cập nhật: harvestStatus, trackingCode, deliveryStatus, staffNote',
        400
      );
    }

    const result = await staffService.updateHarvestProgress(staffId, harvestRequestId, {
      harvestStatus,
      trackingCode,
      carrierName,
      deliveryStatus,
      staffNote,
      proofImageUrl,
    }, userRole);

    return successResponse(
      res,
      result,
      `Đã cập nhật tiến độ đơn thu hoạch #${harvestRequestId} thành công`
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/schedules
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Lấy lịch trình chăm sóc của Staff
 *
 * Query params: range (TODAY|WEEK|MONTH|ALL), cultivationId, activityType, status
 */
const getMySchedules = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const { range, cultivationId, activityType, status } = req.query;

    const VALID_RANGES = ['TODAY', 'WEEK', 'MONTH', 'ALL'];
    const normalizedRange = (range || 'TODAY').toUpperCase();
    if (!VALID_RANGES.includes(normalizedRange)) {
      return errorResponse(
        res,
        `Khoảng thời gian không hợp lệ. Chấp nhận: ${VALID_RANGES.join(', ')}`,
        400
      );
    }

    const filters = {
      range:         normalizedRange,
      cultivationId: cultivationId ? parseInt(cultivationId, 10) : undefined,
      activityType:  activityType  || undefined,
      status:        status        || undefined,
    };

    const schedules = await staffService.getMySchedules(staffId, filters, userRole);

    const rangeLabel = { TODAY: 'hôm nay', WEEK: 'tuần này', MONTH: 'tháng này', ALL: 'toàn bộ' };
    return successResponse(
      res,
      schedules,
      `Lịch chăm sóc ${rangeLabel[normalizedRange]}: ${schedules.length} mục`
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/staff/schedules/:id/complete
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Đánh dấu hoàn thành một mục lịch chăm sóc
 *
 * Body: { resultNote?, resultImageUrl? }
 */
const completeSchedule = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const scheduleId = parseInt(req.params.id, 10);
    if (isNaN(scheduleId) || scheduleId <= 0) {
      return errorResponse(res, 'CareScheduleId không hợp lệ', 400);
    }

    const { resultNote, resultImageUrl } = req.body;

    const result = await staffService.completeSchedule(staffId, scheduleId, {
      resultNote:     resultNote     || null,
      resultImageUrl: resultImageUrl || null,
    }, userRole);

    return successResponse(
      res,
      result,
      `Đã hoàn thành lịch chăm sóc #${scheduleId} (${result.activityType}) — ${result.plotCode}`
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/care-requests
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Lấy danh sách yêu cầu chăm sóc trên các ô đất Staff phụ trách
 * Query params: status (PENDING|COMPLETED|CANCELLED)
 */
const getMyCareRequests = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const { status } = req.query;
    const requests = await staffService.getMyCareRequests(staffId, { status }, userRole);
    return successResponse(res, requests, `Danh sách ${requests.length} yêu cầu chăm sóc`);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/harvest-orders
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Lấy danh sách đơn thu hoạch trên các ô đất Staff phụ trách
 * Query params: status (REQUESTED|PROCESSING|HARVESTED|SHIPPING|DELIVERED)
 */
const getMyHarvestOrders = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const { status } = req.query;
    const orders = await staffService.getMyHarvestOrders(staffId, { status }, userRole);
    return successResponse(res, orders, `Danh sách ${orders.length} đơn thu hoạch`);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/staff/care-requests/:id/accept
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Tiếp nhận yêu cầu chăm sóc từ khách hàng (PENDING -> IN_PROGRESS)
 */
const acceptCareRequest = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId) || requestId <= 0) {
      return errorResponse(res, 'RequestId không hợp lệ', 400);
    }

    const result = await staffService.acceptCareRequest(staffId, requestId, userRole);
    return successResponse(
      res,
      result,
      `Đã tiếp nhận xử lý yêu cầu chăm sóc #${requestId}`
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/staff/harvest-orders/:id/result
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Ghi nhận thu hoạch thực tế (kg), phân loại chất lượng & gửi thông báo cho khách
 * Body: { actualYieldKg, qualityGrade?, inspectionNote?, productImageUrl?, trackingCode?, carrierName? }
 */
const recordHarvestResult = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const isDirectHarvest = req.params.cultivationId !== undefined;
    const harvestRequestId = Number(req.params.cultivationId ?? req.params.id);
    if (!Number.isSafeInteger(harvestRequestId) || harvestRequestId <= 0) {
      return errorResponse(res, 'HarvestRequestId không hợp lệ', 400);
    }

    const { actualYieldKg, qualityGrade, inspectionNote, productImageUrl, trackingCode, carrierName } = req.body;
    const yieldNum = typeof actualYieldKg === 'number' ? actualYieldKg : NaN;
    if (!Number.isFinite(yieldNum) || yieldNum <= 0 || yieldNum > 9999.99) {
      return errorResponse(res, 'Sản lượng thu hoạch phải lớn hơn 0 kg', 400);
    }

    const result = await staffService.recordHarvestResult(staffId, harvestRequestId, {
      cultivationId: isDirectHarvest ? harvestRequestId : null,
      actualYieldKg: yieldNum,
      qualityGrade: qualityGrade || 'GRADE_A',
      inspectionNote: inspectionNote || '',
      productImageUrl: productImageUrl || null,
      trackingCode: trackingCode || null,
      carrierName: carrierName || null,
    }, userRole);

    return successResponse(
      res,
      result,
      `Đã ghi nhận thành công thu hoạch ${yieldNum} kg cho đơn #${harvestRequestId}. Thông báo đã được gửi đến khách hàng!`
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/staff/emergency-alert
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Đăng bài nhật ký khẩn cấp (Sâu bệnh, Úng ngập, Thời tiết xấu) & gửi Notification ưu tiên cho khách
 * Body: { cultivationId, emergencyType, title?, notes?, imageUrl? }
 */
const createEmergencyAlert = async (req, res, next) => {
  try {
    const staffId = req.user?.userId;
    const userRole = req.user?.role || 'Staff';
    if (!staffId) return errorResponse(res, 'Vui lòng đăng nhập', 401);

    const { cultivationId, emergencyType, title, notes, imageUrl } = req.body;
    const cultId = parseInt(cultivationId, 10);
    if (isNaN(cultId) || cultId <= 0) {
      return errorResponse(res, 'CultivationId không hợp lệ', 400);
    }
    if (!emergencyType) {
      return errorResponse(res, 'Vui lòng chọn loại cảnh báo khẩn cấp', 400);
    }

    const result = await staffService.createEmergencyAlert(staffId, cultId, {
      emergencyType,
      title: title || '',
      notes: notes || '',
      imageUrl: imageUrl || null,
    }, userRole);

    return successResponse(
      res,
      result,
      `Đã gửi cảnh báo khẩn cấp "${emergencyType}" và thông báo ưu tiên tới chủ sở hữu ô đất!`,
      201
    );
  } catch (error) {
    next(error);
  }
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
