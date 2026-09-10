const { errorResponse } = require('../utils/responseHelper');

// Handle 404 Not Found
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Đường dẫn API không tồn tại: ${req.method} ${req.originalUrl}`, 404);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  const requestedStatus = err.statusCode || err.status;
  const statusCode = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus : 500;

  if (statusCode >= 500) {
    console.error('>>> [Global Error Handler]:', err.stack || err);
    return errorResponse(res, 'Lỗi máy chủ nội bộ (Internal Server Error)', statusCode);
  }

  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'Nội dung JSON không hợp lệ', 400);
  }
  if (err.type === 'entity.too.large') {
    return errorResponse(res, 'Dữ liệu yêu cầu quá lớn', 413);
  }

  return errorResponse(res, err.message || 'Yêu cầu không hợp lệ', statusCode, err.errors || null);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
