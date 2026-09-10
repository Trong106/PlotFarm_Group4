/**
 * @file socketMiddleware.js
 * @description Middleware giải mã token JWT cho các kết nối Socket.IO
 * Định danh client kết nối (userId, role, email) và hỗ trợ phân quyền Role-based realtime.
 * Tích hợp với authMiddleware.js (Express RBAC) để dùng chung định nghĩa ROLES.
 */

const { verifyToken } = require('../utils/jwtHelper');
const { ROLES } = require('./authMiddleware');

/**
 * Trích xuất JWT token từ handshake của Socket.IO
 * Hỗ trợ các vị trí:
 *  1. socket.handshake.auth.token
 *  2. socket.handshake.headers.authorization (Bearer <token>)
 *  3. socket.handshake.query.token
 *
 * @param {import('socket.io').Socket} socket
 * @returns {string|null} Chuỗi token thuần hoặc null
 */
const extractTokenFromHandshake = (socket) => {
  let rawToken = null;

  if (socket.handshake.auth && socket.handshake.auth.token) {
    rawToken = socket.handshake.auth.token;
  } else if (socket.handshake.headers && socket.handshake.headers.authorization) {
    rawToken = socket.handshake.headers.authorization;
  } else if (socket.handshake.query && socket.handshake.query.token) {
    rawToken = socket.handshake.query.token;
  }

  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  // Cắt bỏ prefix "Bearer " nếu có
  if (rawToken.startsWith('Bearer ')) {
    return rawToken.slice(7).trim();
  }

  return rawToken.trim();
};

/**
 * Middleware Socket.IO: Giải mã JWT Token & định danh Client kết nối.
 *
 * - Nếu có token hợp lệ: giải mã và gán payload vào `socket.user` và `socket.data.user`
 * - Nếu token không hợp lệ / hết hạn: từ chối kết nối (Authentication Error)
 * - Nếu không cung cấp token:
 *     + Mặc định cho phép kết nối ở chế độ Guest (khách vãng lai, role = 'Guest', isAnonymous = true)
 *     + Hoặc nếu cấu hình strict = true thì từ chối kết nối
 *
 * @param {object} [options]
 * @param {boolean} [options.strict=false] - Nếu true, bắt buộc phải có token hợp lệ mới cho kết nối
 * @returns {(socket: import('socket.io').Socket, next: (err?: Error) => void) => void}
 */
const socketAuthMiddleware = (options = { strict: false }) => {
  return (socket, next) => {
    const token = extractTokenFromHandshake(socket);

    if (!token) {
      if (options.strict) {
        const authErr = new Error('Xác thực thất bại: Thiếu JWT Token xác thực.');
        authErr.data = { code: 'TOKEN_REQUIRED' };
        return next(authErr);
      }

      // Đánh dấu client là khách chưa đăng nhập
      socket.user = {
        isAnonymous: true,
        userId: null,
        role: 'Guest',
        fullName: 'Khách Vãng Lai',
      };
      socket.data.user = socket.user;
      return next();
    }

    try {
      const decoded = verifyToken(token);

      // Định danh client thành công
      socket.user = {
        isAnonymous: false,
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email || null,
        fullName: decoded.fullName || null,
      };
      socket.data.user = socket.user;

      console.log(
        `[Socket.IO Auth] Client ${socket.id} định danh thành công: User #${decoded.userId} (Role: ${decoded.role})`
      );

      next();
    } catch (err) {
      console.warn(`[Socket.IO Auth] Client ${socket.id} xác thực JWT thất bại: ${err.message}`);
      const authErr = new Error(`Xác thực thất bại: ${err.message || 'Token không hợp lệ hoặc đã hết hạn.'}`);
      authErr.data = { code: 'INVALID_OR_EXPIRED_TOKEN' };
      next(authErr);
    }
  };
};

/**
 * Helper kiểm tra vai trò (Role) của socket client trước khi thực hiện hành động.
 * Nhất quán với checkRole() trong authMiddleware: so khớp KHÔNG phân biệt chữ hoa/thường.
 *
 * @param {import('socket.io').Socket} socket
 * @param {string[]} allowedRoles - Danh sách các role được phép (VD: ['Admin', 'Staff'])
 * @returns {boolean}
 */
const checkSocketRole = (socket, allowedRoles = []) => {
  if (!socket.user || socket.user.isAnonymous) {
    return false;
  }
  const userRole = String(socket.user.role || '').trim().toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => String(r).trim().toUpperCase());
  return normalizedAllowed.includes(userRole);
};

module.exports = {
  extractTokenFromHandshake,
  socketAuthMiddleware,
  checkSocketRole,
  ROLES, // Re-export để các file khác dùng chung
};
