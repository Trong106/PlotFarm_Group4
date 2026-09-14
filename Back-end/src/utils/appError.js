/**
 * @file appError.js
 * @description Hệ thống định nghĩa các lớp lỗi chuẩn hóa (Custom Error Classes) cho PlotFarm
 * Hệ thống: PlotFarm Team 4 - Express.js Backend
 */

class AppError extends Error {
  /**
   * @param {string} message - Thông điệp lỗi
   * @param {number} statusCode - Mã trạng thái HTTP (mặc định 500)
   * @param {any} errors - Chi tiết các trường bị lỗi (nếu có)
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Lỗi 400 Bad Request: Dữ liệu đầu vào sai, cú pháp JSON hỏng, hoặc vi phạm validation
 */
class BadRequestError extends AppError {
  constructor(message = 'Yêu cầu không hợp lệ (Bad Request)', errors = null) {
    super(message, 400, errors);
  }
}

/**
 * Lỗi 401 Unauthorized: Chưa đăng nhập, thiếu token, token giả mạo hoặc hết hạn
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Yêu cầu xác thực tài khoản hợp lệ (Unauthorized)', errors = null) {
    super(message, 401, errors);
  }
}

/**
 * Lỗi 403 Forbidden: Không đủ quyền truy cập tài nguyên hoặc tài khoản bị khóa
 */
class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền truy cập tài nguyên này (Forbidden)', errors = null) {
    super(message, 403, errors);
  }
}

/**
 * Lỗi 404 Not Found: Endpoint hoặc tài nguyên tìm kiếm không tồn tại
 */
class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên yêu cầu (Not Found)', errors = null) {
    super(message, 404, errors);
  }
}

/**
 * Lỗi 500 Internal Server Error: Lỗi CSDL hoặc lỗi hệ thống chưa được kiểm soát
 */
class InternalServerError extends AppError {
  constructor(message = 'Lỗi máy chủ nội bộ (Internal Server Error)', errors = null) {
    super(message, 500, errors);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
};
