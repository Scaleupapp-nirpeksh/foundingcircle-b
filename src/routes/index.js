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

// ============================================
// MOUNT ROUTES
// ============================================

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profiles', profileRoutes);
router.use('/uploads', uploadRoutes);

// Future routes will be added here:
// router.use('/openings', openingRoutes);
// router.use('/matches', matchRoutes);
// router.use('/conversations', conversationRoutes);
// router.use('/trials', trialRoutes);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
