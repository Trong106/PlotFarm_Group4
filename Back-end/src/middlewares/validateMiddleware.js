const { errorResponse } = require('../utils/responseHelper');

const validateBody = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return errorResponse(res, 'Dữ liệu đăng ký không hợp lệ', 400, errors);
    }

    // Only validated fields reach the controller; unknown fields are stripped.
    req.body = result.data;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { validateBody };
