const adminService = require('../services/adminService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// 1. Analytics
const getAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalytics();
    return successResponse(res, data, 'Lấy dữ liệu báo cáo thống kê thành công');
  } catch (error) {
    next(error);
  }
};

// 2. Packages
const getAllPackages = async (req, res, next) => {
  try {
    const data = await adminService.getAllPackages();
    return successResponse(res, data, 'Lấy danh sách gói chăm sóc thành công');
  } catch (error) {
    next(error);
  }
};

const createPackage = async (req, res, next) => {
  try {
    const data = await adminService.createPackage(req.body);
    return successResponse(res, data, 'Tạo gói chăm sóc thành công', 201);
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const packageId = parseInt(req.params.id, 10);
    const data = await adminService.updatePackage(packageId, req.body);
    return successResponse(res, data, 'Cập nhật gói chăm sóc thành công');
  } catch (error) {
    next(error);
  }
};

const deletePackage = async (req, res, next) => {
  try {
    const packageId = parseInt(req.params.id, 10);
    const data = await adminService.deletePackage(packageId);
    return successResponse(res, data, 'Vô hiệu hóa gói chăm sóc thành công');
  } catch (error) {
    next(error);
  }
};

// 3. Seeds
const getAllSeeds = async (req, res, next) => {
  try {
    const data = await adminService.getAllSeeds();
    return successResponse(res, data, 'Lấy danh sách giống cây thành công');
  } catch (error) {
    next(error);
  }
};

const createSeed = async (req, res, next) => {
  try {
    const data = await adminService.createSeed(req.body);
    return successResponse(res, data, 'Tạo giống cây mới thành công', 201);
  } catch (error) {
    next(error);
  }
};

const updateSeed = async (req, res, next) => {
  try {
    const seedId = parseInt(req.params.id, 10);
    const data = await adminService.updateSeed(seedId, req.body);
    return successResponse(res, data, 'Cập nhật giống cây thành công');
  } catch (error) {
    next(error);
  }
};

const deleteSeed = async (req, res, next) => {
  try {
    const seedId = parseInt(req.params.id, 10);
    const data = await adminService.deleteSeed(seedId);
    return successResponse(res, data, 'Vô hiệu hóa giống cây thành công');
  } catch (error) {
    next(error);
  }
};

// 4. Staff Assignments
const getStaffAssignments = async (req, res, next) => {
  try {
    const data = await adminService.getStaffAssignments();
    return successResponse(res, data, 'Lấy danh sách phân công nhân viên thành công');
  } catch (error) {
    next(error);
  }
};

const getStaffUsers = async (req, res, next) => {
  try {
    const data = await adminService.getStaffUsers();
    return successResponse(res, data, 'Lấy danh sách nhân viên kỹ thuật thành công');
  } catch (error) {
    next(error);
  }
};

const createStaffAssignment = async (req, res, next) => {
  try {
    const data = await adminService.createStaffAssignment(req.body);
    return successResponse(res, data, 'Gán nhân viên kỹ thuật vào phân khu thành công', 201);
  } catch (error) {
    next(error);
  }
};

const deleteStaffAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const data = await adminService.deleteStaffAssignment(assignmentId);
    return successResponse(res, data, 'Hủy phân công nhân viên thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getAllSeeds,
  createSeed,
  updateSeed,
  deleteSeed,
  getStaffAssignments,
  getStaffUsers,
  createStaffAssignment,
  deleteStaffAssignment,
};
