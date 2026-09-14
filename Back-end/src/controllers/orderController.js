const orderService = require('../services/orderService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const mockCheckout = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return errorResponse(res, 'Vui lòng đăng nhập để thực hiện đặt thuê', 401);
    }
    const orderResult = await orderService.createMockCheckout(userId, req.body);
    return successResponse(res, orderResult, 'Thanh toán thành công! Ô đất đã được kích hoạt canh tác.', 201);
  } catch (error) {
    next(error);
  }
};

const getMyFarm = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return errorResponse(res, 'Vui lòng đăng nhập', 401);
    }
    const cultivations = await orderService.getMyCultivations(userId);
    return successResponse(res, cultivations, 'Lấy danh sách mùa vụ thành công');
  } catch (error) {
    next(error);
  }
};

const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAllOrders();
    return successResponse(res, orders, 'Lấy danh sách đơn hàng thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  mockCheckout,
  getMyFarm,
  getAdminOrders,
};
