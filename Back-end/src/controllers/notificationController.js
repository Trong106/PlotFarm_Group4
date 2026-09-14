const notificationService = require('../services/notificationService');
const { successResponse } = require('../utils/responseHelper');

const getMyNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getMyNotifications(req.user.userId);
    return successResponse(res, data, 'Lấy danh sách thông báo thành công');
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    return successResponse(res, { unreadCount: count }, 'Lấy số lượng thông báo chưa đọc thành công');
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const data = await notificationService.markAsRead(notificationId, req.user.userId);
    return successResponse(res, data, 'Đã đánh dấu thông báo đã đọc');
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    return successResponse(res, null, result.message);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
