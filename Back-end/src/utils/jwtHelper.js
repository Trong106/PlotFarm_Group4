/**
 * @file jwtHelper.js
 * @description Middleware/Utility tạo và ký JWT token cho PlotFarm API.
 *
 * Cung cấp các hàm:
 *  - generateToken(payload)  : Ký và trả về JWT token
 *  - signTokenMiddleware      : Express middleware gắn token vào res.locals sau khi
 *                               controller đặt res.locals.tokenPayload
 *  - verifyToken(token)       : Xác minh & giải mã token (dùng nội bộ)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'PlotFarm_Super_Secret_Key_2026_Team4';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Tạo và ký một JWT token.
 *
 * @param {{ userId: number|string, role: string, [key: string]: any }} payload
 *   - userId : ID người dùng (bắt buộc)
 *   - role   : Tên vai trò (bắt buộc, VD: 'Customer', 'Admin', 'Staff')
 * @param {string} [expiresIn] - Thời hạn token (mặc định lấy từ env JWT_EXPIRES_IN)
 * @returns {string} JWT token đã được ký
 * @throws {Error} Nếu thiếu userId hoặc role trong payload
 */
const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  if (!payload || !payload.userId || !payload.role) {
    throw new Error('generateToken: payload phải chứa userId và role');
  }

  const tokenPayload = {
    userId: payload.userId,
    role: payload.role,
    // Các trường tuỳ chọn bổ sung (nếu có)
    ...(payload.email && { email: payload.email }),
  };

  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn });
};

/**
 * Xác minh và giải mã một JWT token.
 *
 * @param {string} token - JWT token cần xác minh
 * @returns {{ userId: number|string, role: string, email?: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError} Nếu token không hợp lệ hoặc đã hết hạn
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Express Middleware: Tự động tạo và ký JWT token sau khi xử lý nghiệp vụ.
 *
 * Cách dùng trong route:
 *   router.post('/register', registerController, signTokenMiddleware, sendResponse);
 *
 * Controller trước đó phải đặt:
 *   res.locals.tokenPayload = { userId, role, email? }
 *
 * Middleware này sẽ:
 *   1. Đọc res.locals.tokenPayload
 *   2. Gọi generateToken() để ký token
 *   3. Gắn token vào res.locals.token để handler tiếp theo dùng
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const signTokenMiddleware = (req, res, next) => {
  try {
    const payload = res.locals.tokenPayload;

    if (!payload) {
      // Không có payload → bỏ qua, tiếp tục chain
      return next();
    }

    res.locals.token = generateToken(payload);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateToken,
  verifyToken,
  signTokenMiddleware,
};
