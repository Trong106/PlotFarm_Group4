const adminUserService = require('../services/adminUserService');
const { successResponse } = require('../utils/responseHelper');

const listUsers = async (req, res, next) => {
  try {
    const result = await adminUserService.listUsers(req.validatedQuery);
    return successResponse(res, result, 'Lấy danh sách người dùng thành công');
  } catch (error) {
    return next(error);
  }
};

module.exports = { listUsers };
