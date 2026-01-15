/**
 * @fileoverview Routes Index
 *
 * Aggregates all route modules and exports them for use in app.js
 *
 * @module routes
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const profileRoutes = require('./profile.routes');
const uploadRoutes = require('./upload.routes');
const openingRoutes = require('./opening.routes');
const interestRoutes = require('./interest.routes');
const matchingRoutes = require('./matching.routes');
const conversationRoutes = require('./conversation.routes');
const trialRoutes = require('./trial.routes');
const notificationRoutes = require('./notification.routes');

// ============================================
// MOUNT ROUTES
// ============================================

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profiles', profileRoutes);
router.use('/uploads', uploadRoutes);
router.use('/openings', openingRoutes);
router.use('/interests', interestRoutes);
router.use('/matches', matchingRoutes);
router.use('/conversations', conversationRoutes);
router.use('/trials', trialRoutes);
router.use('/notifications', notificationRoutes);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
