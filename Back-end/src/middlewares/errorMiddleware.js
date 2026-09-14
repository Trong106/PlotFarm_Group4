/**
 * @file errorMiddleware.js
 * @description Middleware chuẩn hóa xử lý lỗi (400, 401, 403, 404, 500) toàn cục trong Express
 * Hệ thống: PlotFarm Team 4 - Express.js Backend
 */

const { errorResponse } = require('../utils/responseHelper');

/**
 * Xử lý lỗi 404 Not Found khi client gọi vào route không tồn tại
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(
    res,
    `Đường dẫn API không tồn tại: ${req.method} ${req.originalUrl}`,
    404
  );
};

/**
 * Middleware bắt và chuẩn hóa toàn bộ lỗi (Global Error Handler)
 * Đảm bảo format đồng nhất: { success: false, statusCode, message, errors, timestamp }
 * @param {any} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // 1. Xác định mã trạng thái HTTP
  const requestedStatus = err.statusCode || err.status;
  const statusCode = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus
    : 500;

  // 2. Xử lý lỗi CORS (Chặn truy cập từ origin trái phép)
  if (err.message && err.message.includes('CORS')) {
    return errorResponse(res, err.message, 403);
  }

  // 3. Xử lý lỗi cú pháp JSON Body (400 Bad Request)
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return errorResponse(res, 'Nội dung JSON không hợp lệ', 400);
  }

  // 4. Xử lý lỗi kích thước payload vượt ngưỡng (413 Payload Too Large)
  if (err.type === 'entity.too.large') {
    return errorResponse(res, 'Dữ liệu yêu cầu quá lớn', 413);
  }

  // 5. Xử lý lỗi máy chủ nội bộ (500 Internal Server Error)
  if (statusCode >= 500) {
    console.error('>>> [Global Error Handler]:', err.stack || err);
    // Bảo mật: Tuyệt đối không để lộ chi tiết lỗi SQL hay stack trace ra ngoài client
    return errorResponse(res, 'Lỗi máy chủ nội bộ (Internal Server Error)', statusCode);
  }

  // 6. Xử lý các lỗi nghiệp vụ khác (400, 401, 403, 404, 409...)
  return errorResponse(
    res,
    err.message || 'Yêu cầu không hợp lệ',
    statusCode,
    err.errors || null
  );
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
