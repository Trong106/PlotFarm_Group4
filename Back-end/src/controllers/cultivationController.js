const cultivationService = require('../services/cultivationService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getLogs = async (req, res, next) => {
  try {
    const cultivationId = parseInt(req.params.id, 10);
    if (isNaN(cultivationId)) {
      return errorResponse(res, 'CultivationId không hợp lệ', 400);
    }
    const logs = await cultivationService.getCultivationLogs(cultivationId);
    return successResponse(res, logs, 'Lấy nhật ký canh tác thành công');
  } catch (error) {
    next(error);
  }
};

const createLog = async (req, res, next) => {
  try {
    const cultivationId = parseInt(req.params.id, 10);
    const { activityType, title, notes, imageUrl, plantHealthStatus } = req.body;
    if (!title || !activityType) {
      return errorResponse(res, 'Tiêu đề và loại hoạt động là bắt buộc', 400);
    }
    const staffId = req.user?.userId || 2;
    const newLog = await cultivationService.createCultivationLog({
      cultivationId,
      staffId,
      activityType,
      title,
      notes,
      imageUrl,
      plantHealthStatus,
    });
    return successResponse(res, newLog, 'Thêm nhật ký canh tác thành công', 201);
  } catch (error) {
    next(error);
  }
};

const createCareRequest = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return errorResponse(res, 'Vui lòng đăng nhập', 401);
    }
    const { cultivationId, serviceType, customerNote, priority } = req.body;
    if (!cultivationId || !serviceType) {
      return errorResponse(res, 'Mã mùa vụ và loại dịch vụ là bắt buộc', 400);
    }
    const result = await cultivationService.createCareRequest(userId, { cultivationId, serviceType, customerNote, priority });
    return successResponse(res, result, 'Gửi yêu cầu chăm sóc thành công! Kỹ thuật viên sẽ xử lý sớm nhất.', 201);
  } catch (error) {
    next(error);
  }
};

const getMyCareRequests = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return errorResponse(res, 'Vui lòng đăng nhập', 401);
    }
    const requests = await cultivationService.getMyCareRequests(userId);
    return successResponse(res, requests, 'Lấy danh sách yêu cầu chăm sóc thành công');
  } catch (error) {
    next(error);
  }
};

const createHarvest = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return errorResponse(res, 'Vui lòng đăng nhập', 401);
    }
    const { cultivationId, harvestType, recipientName, phoneNumber, deliveryAddress, customerNote } = req.body;
    if (!cultivationId) {
      return errorResponse(res, 'Mã mùa vụ là bắt buộc', 400);
    }
    const result = await cultivationService.createHarvestRequest(userId, {
      cultivationId,
      harvestType,
      recipientName,
      phoneNumber,
      deliveryAddress,
      customerNote,
    });
    return successResponse(res, result, 'Yêu cầu thu hoạch đã được tiếp nhận và xử lý!', 201);
  } catch (error) {
    next(error);
  }
};

const getMyDeliveries = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return errorResponse(res, 'Vui lòng đăng nhập', 401);
    }
    const deliveries = await cultivationService.getMyDeliveries(userId);
    return successResponse(res, deliveries, 'Lấy thông tin vận chuyển thành công');
  } catch (error) {
    next(error);
  }
};

const getYieldAnalytics = async (req, res, next) => {
  try {
    const cultivationId = parseInt(req.params.id, 10);
    if (isNaN(cultivationId) || cultivationId <= 0) {
      return errorResponse(res, 'CultivationId không hợp lệ. Vui lòng truyền số nguyên dương.', 400);
    }
    const analytics = await cultivationService.getYieldAnalytics(cultivationId);
    return successResponse(res, analytics, 'Phân tích sản lượng vụ mùa thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogs,
  createLog,
  createCareRequest,
  getMyCareRequests,
  createHarvest,
  getMyDeliveries,
  getYieldAnalytics,
};
