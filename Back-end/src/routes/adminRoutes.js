const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// All routes in this router require authentication and Admin role
router.use(verifyToken, requireAdmin);

// 1. Analytics & Reporting
router.get('/analytics', adminController.getAnalytics);

// 2. Care Packages CRUD
router.get('/packages', adminController.getAllPackages);
router.post('/packages', adminController.createPackage);
router.put('/packages/:id', adminController.updatePackage);
router.delete('/packages/:id', adminController.deletePackage);

// 3. Seeds CRUD
router.get('/seeds', adminController.getAllSeeds);
router.post('/seeds', adminController.createSeed);
router.put('/seeds/:id', adminController.updateSeed);
router.delete('/seeds/:id', adminController.deleteSeed);

// 4. Staff Assignments
router.get('/staff-assignments', adminController.getStaffAssignments);
router.get('/staff-users', adminController.getStaffUsers);
router.post('/staff-assignments', adminController.createStaffAssignment);
router.delete('/staff-assignments/:id', adminController.deleteStaffAssignment);

module.exports = router;
