const express = require('express');
const router = express.Router();
const seedController = require('../controllers/seedController');

router.get('/', seedController.getSeeds);
router.get('/packages', seedController.getCarePackages);

module.exports = router;
