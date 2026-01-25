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
const authRoutes = require('../auth/routes/auth.routes');
const userRoutes = require('../user/routes/user.routes');
const profileRoutes = require('../profile/routes/profile.routes');
const uploadRoutes = require('../upload/routes/upload.routes');
const openingRoutes = require('../opening/routes/opening.routes');
const interestRoutes = require('../interest/routes/interest.routes');
const matchingRoutes = require('../matching/routes/matching.routes');
const conversationRoutes = require('../conversation/routes/conversation.routes');
const connectionRoutes = require('../connection/routes/connection.routes');
const trialRoutes = require('../trial/routes/trial.routes');
const notificationRoutes = require('../notification/routes/notification.routes');
const teamRoutes = require('../team/routes/team.routes');

// ============================================
// MOUNT ROUTES
// ============================================

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profiles', profileRoutes);
router.use('/uploads', uploadRoutes);
router.use('/upload', uploadRoutes); // Alias for /uploads (singular form)
router.use('/openings', openingRoutes);
router.use('/interests', interestRoutes);
router.use('/matches', matchingRoutes);
router.use('/conversations', conversationRoutes);
router.use('/connections', connectionRoutes);
router.use('/trials', trialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/team', teamRoutes);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
