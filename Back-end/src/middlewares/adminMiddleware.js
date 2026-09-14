const { assertActiveAdmin } = require('../services/adminUserService');

// Run after verifyToken and checkRole(Admin).
const requireActiveAdmin = async (req, res, next) => {
  try {
    await assertActiveAdmin(req.user?.userId);
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { requireActiveAdmin };
