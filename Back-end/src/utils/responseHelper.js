/**
 * Standard API Response Helper
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
