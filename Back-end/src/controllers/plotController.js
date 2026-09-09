const plotService = require('../services/plotService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getGrid = async (req, res, next) => {
  try {
    const { status, areaId } = req.query;
    const plots = await plotService.getPlotGrid({ status, areaId });
    return successResponse(res, plots, 'Lấy danh sách bản đồ ô đất thành công');
  } catch (error) {
    next(error);
  }
};

const reserve = async (req, res, next) => {
  try {
    const { plotId } = req.body;
    if (!plotId) {
      return errorResponse(res, 'Mã ô đất (plotId) là bắt buộc', 400);
    }
    const result = await plotService.reservePlot(plotId, req.user?.userId);
    return successResponse(res, result, 'Giữ chỗ ô đất thành công trong 15 phút', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGrid,
  reserve,
};
