const authService = require('../services/authService');
const { successResponse } = require('../utils/responseHelper');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    const newUser = await authService.registerUser({ fullName, email, password, phoneNumber });
    return successResponse(res, newUser, 'Đăng ký tài khoản thành công', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });
    return successResponse(res, result, 'Đăng nhập thành công', 200);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const session = authService.getCurrentSession(req.user);
    return successResponse(res, session, 'Lấy thông tin phiên đăng nhập thành công', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
