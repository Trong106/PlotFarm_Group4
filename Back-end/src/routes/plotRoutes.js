const express = require('express');
const router = express.Router();
const plotController = require('../controllers/plotController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/grid', plotController.getGrid);
router.post('/reserve', verifyToken, plotController.reserve);

module.exports = router;
