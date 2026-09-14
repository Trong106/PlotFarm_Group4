/**
 * Standard API Response Helper
 * Chuẩn hóa cấu trúc phản hồi thành công và lỗi cho toàn bộ hệ thống API PlotFarm
 * Hệ thống: PlotFarm Team 4 - Express.js Backend
 */

/**
 * Phản hồi thành công chuẩn hóa (HTTP 2xx)
 * @param {import('express').Response} res
 * @param {any} data - Dữ liệu trả về
 * @param {string} message - Thông điệp thành công
 * @param {number} statusCode - Mã trạng thái HTTP (mặc định 200)
 */
const successResponse = (res, data = null, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Phản hồi lỗi chuẩn hóa (HTTP 4xx, 5xx)
 * @param {import('express').Response} res
 * @param {string} message - Thông điệp lỗi
 * @param {number} statusCode - Mã trạng thái HTTP (mặc định 500)
 * @param {any} errors - Chi tiết các trường hoặc mã lỗi cụ thể (nếu có)
 */
const errorResponse = (res, message = 'Đã có lỗi xảy ra', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
