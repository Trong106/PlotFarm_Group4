const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const cultivationController = require('../controllers/cultivationController');
const { verifyToken, requireStaffOrAdmin } = require('../middlewares/authMiddleware');

// Get current user's farm plots & cultivations
router.get('/my-farm', verifyToken, orderController.getMyFarm);

// Care Requests
router.post('/care-requests', verifyToken, cultivationController.createCareRequest);
router.get('/care-requests/my', verifyToken, cultivationController.getMyCareRequests);

// Harvest & Deliveries
router.post('/harvest', verifyToken, cultivationController.createHarvest);
router.get('/deliveries/my', verifyToken, cultivationController.getMyDeliveries);

// Cultivation Logs (Journal Timeline)
router.get('/:id/logs', verifyToken, cultivationController.getLogs);
router.post('/:id/logs', requireStaffOrAdmin, cultivationController.createLog);

module.exports = router;
