const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    if (!fullName || !email || !password) {
      return errorResponse(res, 'Họ tên, email và mật khẩu là các trường bắt buộc', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Mật khẩu phải có tối thiểu 6 ký tự', 400);
    }

    const newUser = await authService.registerUser({ fullName, email, password, phoneNumber });
    return successResponse(res, newUser, 'Đăng ký tài khoản thành công', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Vui lòng cung cấp đầy đủ email và mật khẩu', 400);
    }

    const result = await authService.loginUser({ email, password });
    return successResponse(res, result, 'Đăng nhập thành công', 200);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return successResponse(res, req.user, 'Lấy thông tin phiên đăng nhập thành công', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
