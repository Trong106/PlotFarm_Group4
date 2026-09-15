const express = require('express');
const router = express.Router();
const plotController = require('../controllers/plotController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/areas', plotController.getAreas);
router.get('/grid', plotController.getGrid);
router.post('/reserve', verifyToken, plotController.reserve);
router.patch('/:plotId/status', verifyToken, requireAdmin, plotController.updateStatus);

module.exports = router;
