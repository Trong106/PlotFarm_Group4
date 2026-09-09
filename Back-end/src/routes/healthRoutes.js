const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/responseHelper');

router.get('/', (req, res) => {
  return successResponse(res, {
    status: 'ONLINE',
    serverTime: new Date().toISOString(),
    service: 'PlotFarm Express Backend API',
    version: '1.0.0',
  }, 'PlotFarm API Server is running healthy!');
});

module.exports = router;
