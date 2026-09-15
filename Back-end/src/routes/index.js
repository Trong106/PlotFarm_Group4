const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const plotRoutes = require('./plotRoutes');
const userRoutes = require('./userRoutes');
const seedRoutes = require('./seedRoutes');
const orderRoutes = require('./orderRoutes');
const cultivationRoutes = require('./cultivationRoutes');
const notificationRoutes = require('./notificationRoutes');
const staffRoutes = require('./staffRoutes');

// Mount Sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/plots', plotRoutes);
router.use('/users', userRoutes);
router.use('/seeds', seedRoutes);
router.use('/orders', orderRoutes);
router.use('/cultivations', cultivationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/staff', staffRoutes);           // Cổng Nhân Viên Kỹ Thuật Nông Trại

module.exports = router;

