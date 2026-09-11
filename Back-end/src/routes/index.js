const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const plotRoutes = require('./plotRoutes');
const userRoutes = require('./userRoutes');

// Mount Sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/plots', plotRoutes);
router.use('/users', userRoutes);

module.exports = router;
