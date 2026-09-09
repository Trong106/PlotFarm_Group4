const { errorResponse } = require('../utils/responseHelper');

// Handle 404 Not Found
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Đường dẫn API không tồn tại: ${req.method} ${req.originalUrl}`, 404);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  console.error('>>> [Global Error Handler]:', err.stack || err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ (Internal Server Error)';
  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
