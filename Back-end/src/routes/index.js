const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const plotRoutes = require('./plotRoutes');

// Mount Sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/plots', plotRoutes);

module.exports = router;
