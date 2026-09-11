const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const loadCurrentUser = async (req, res, next) => {
  try {
    if (!Number.isInteger(req.user.userId) || req.user.userId < 1 || req.user.userId > 2147483647) {
      return errorResponse(res, 'Token không chứa mã người dùng hợp lệ', 401);
    }
    req.profile = await userService.getProfile(req.user.userId);
    if (req.profile.status !== 'ACTIVE') {
      return errorResponse(res, 'Tài khoản đã bị khóa hoặc chưa kích hoạt', 403);
    }
    return next();
  } catch (error) { return next(error); }
};

const getProfile = (req, res) => successResponse(res, req.profile, 'Lấy thông tin cá nhân thành công');

const handle = (operation, message, statusCode = 200) => async (req, res, next) => {
  try {
    const result = await operation(req);
    return successResponse(res, result, message, statusCode);
  } catch (error) { return next(error); }
};

module.exports = {
  loadCurrentUser,
  getProfile,
  updateProfile: handle((req) => userService.updateProfile(req.user.userId, req.body), 'Cập nhật thông tin cá nhân thành công'),
  listAddresses: handle((req) => userService.listAddresses(req.user.userId), 'Lấy danh sách địa chỉ thành công'),
  getAddress: handle((req) => userService.getAddress(req.user.userId, req.params.addressId), 'Lấy địa chỉ thành công'),
  createAddress: handle((req) => userService.createAddress(req.user.userId, req.body), 'Thêm địa chỉ thành công', 201),
  updateAddress: handle((req) => userService.updateAddress(req.user.userId, req.params.addressId, req.body), 'Cập nhật địa chỉ thành công'),
  deleteAddress: handle((req) => userService.deleteAddress(req.user.userId, req.params.addressId), 'Xóa địa chỉ thành công'),
};
