const { errorResponse } = require('../utils/responseHelper');

const validateBody = (schema, defaultMessage = 'Dữ liệu không hợp lệ') => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return errorResponse(res, defaultMessage, 400, errors);
    }

    // Only validated fields reach the controller; unknown fields are stripped.
    req.body = result.data;
    return next();
  } catch (error) {
    return next(error);
  }
};

const validateParams = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return errorResponse(res, 'Tham số đường dẫn không hợp lệ', 400,
        result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })));
    }
    req.params = result.data;
    return next();
  } catch (error) {
    return next(error);
  }
};

const validateQuery = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return errorResponse(res, 'Tham số truy vấn không hợp lệ', 400,
        result.error.issues.map((issue) => ({ field: issue.path.join('.') || 'query', message: issue.message })));
    }
    req.validatedQuery = result.data;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { validateBody, validateParams, validateQuery };
