const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get current user's farm plots & cultivations
router.get('/my-farm', verifyToken, orderController.getMyFarm);

module.exports = router;
