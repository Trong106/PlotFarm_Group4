/**
 * @file authMiddleware.js
 * @description Middleware xác thực phiên người dùng (JWT) và phân quyền truy cập theo vai trò (RBAC)
 * Hệ thống: PlotFarm Team 4 - Express.js Backend
 */

const jwt = require('jsonwebtoken');
const { verifyToken: verifyJwt } = require('../utils/jwtHelper');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Định nghĩa hằng số các vai trò chuẩn trong hệ thống PlotFarm
 */
const ROLES = Object.freeze({
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CUSTOMER: 'Customer',
});

/**
 * Middleware Xác thực JWT Token (Authentication)
 * Đọc token từ header 'Authorization: Bearer <token>', xác minh chữ ký và gán payload vào req.user
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return errorResponse(res, 'Yêu cầu Token xác thực hợp lệ (Bearer token)', 401, 'AUTH_HEADER_MISSING');
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return errorResponse(res, 'Yêu cầu Token xác thực hợp lệ (Bearer token)', 401, 'INVALID_TOKEN_FORMAT');
    }

    const token = parts[1];
    if (!token) {
      return errorResponse(res, 'Yêu cầu Token xác thực hợp lệ (Bearer token)', 401, 'EMPTY_TOKEN');
    }

    // Xác minh token bằng helper chung (hoặc fallback thư viện jwt)
    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (err) {
      // Bắt chi tiết từng loại lỗi JWT
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 401, 'TOKEN_EXPIRED');
      }
      if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 401, 'INVALID_SIGNATURE');
      }
      if (err.name === 'NotBeforeError') {
        return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 401, 'TOKEN_NOT_ACTIVE');
      }
      return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 401, 'TOKEN_VERIFICATION_FAILED');
    }

    // Gán thông tin người dùng vào request để các middleware/controller phía sau sử dụng
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      ...(decoded.fullName && { fullName: decoded.fullName }),
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Đã xảy ra lỗi trong quá trình xác thực phiên đăng nhập', 500, 'AUTH_INTERNAL_ERROR');
  }
};

/**
 * Middleware Phân quyền Truy cập theo Vai trò (Role-based Access Control - RBAC)
 * Hỗ trợ truyền mảng: checkRole(['Admin', 'Staff']) hoặc danh sách tham số: checkRole('Admin', 'Staff')
 *
 * @param {string[]|string} allowedRoles - Danh sách các vai trò được phép truy cập
 * @returns {import('express').RequestHandler}
 */
const checkRole = (...allowedRoles) => {
  // Chuẩn hóa input: nếu truyền mảng ['Admin', 'Staff'] thì làm phẳng mảng
  const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

  return (req, res, next) => {
    // 1. Kiểm tra xem request đã qua verifyToken chưa
    if (!req.user) {
      return errorResponse(
        res,
        'Yêu cầu xác thực tài khoản trước khi kiểm tra quyền hạn (verifyToken must be called first)',
        401,
        'UNAUTHENTICATED'
      );
    }

    // 2. Nếu không giới hạn role nào, mặc định cho qua nếu đã đăng nhập
    if (!roles || roles.length === 0) {
      return next();
    }

    // 3. So khớp vai trò không phân biệt chữ hoa chữ thường
    const userRole = String(req.user.role || '').trim().toUpperCase();
    const normalizedAllowedRoles = roles.map((r) => String(r).trim().toUpperCase());

    const isAllowed = normalizedAllowedRoles.includes(userRole);

    if (!isAllowed) {
      return errorResponse(
        res,
        `Truy cập bị từ chối: Yêu cầu vai trò [${roles.join(', ')}], nhưng vai trò hiện tại của bạn là [${req.user.role || 'Không xác định'}]`,
        403,
        'FORBIDDEN_ROLE'
      );
    }

    next();
  };
};

/**
 * Các middleware tiện ích cấu hình sẵn theo vai trò thường dùng
 */
const requireAdmin = [verifyToken, checkRole([ROLES.ADMIN])];
const requireStaffOrAdmin = [verifyToken, checkRole([ROLES.STAFF, ROLES.ADMIN])];
const requireCustomer = [verifyToken, checkRole([ROLES.CUSTOMER])];

module.exports = {
  verifyToken,
  checkRole,
  ROLES,
  requireAdmin,
  requireStaffOrAdmin,
  requireCustomer,
};
