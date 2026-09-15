const seedService = require('../services/seedService');
const { successResponse } = require('../utils/responseHelper');

const getSeeds = async (req, res, next) => {
  try {
    const { category } = req.query;
    const seeds = await seedService.getAllSeeds(category);
    return successResponse(res, seeds, 'Lấy danh sách giống cây trồng thành công');
  } catch (error) {
    next(error);
  }
};

const getCarePackages = async (req, res, next) => {
  try {
    const packages = await seedService.getAllCarePackages();
    return successResponse(res, packages, 'Lấy danh sách gói chăm sóc thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSeeds,
  getCarePackages,
};
