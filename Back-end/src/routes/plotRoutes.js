const express = require('express');
const router = express.Router();
const plotController = require('../controllers/plotController');
const { verifyToken, requireStaffOrAdmin } = require('../middlewares/authMiddleware');

router.get('/', plotController.getGrid);
router.get('/areas', plotController.getAreas);
router.get('/grid', plotController.getGrid);
router.post('/reserve', verifyToken, plotController.reserve);
router.post('/release', verifyToken, plotController.release);
router.patch('/:plotId/status', requireStaffOrAdmin, plotController.updateStatus);

module.exports = router;
