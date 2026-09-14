const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// Customer checkout
router.post('/mock-checkout', verifyToken, orderController.mockCheckout);

// Admin view all orders
router.get('/', verifyToken, requireAdmin, orderController.getAdminOrders);

module.exports = router;
