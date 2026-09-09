const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Yêu cầu Token xác thực hợp lệ (Bearer token)', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'PlotFarm_Super_Secret_Key_2026_Team4');
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
};

const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Người dùng chưa được xác thực', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Bạn không có quyền truy cập tài nguyên này', 403);
    }
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole,
};
