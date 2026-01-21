/**
 * @fileoverview Notification Routes
 *
 * Defines all notification-related API endpoints.
 *
 * @module routes/notification
 */

const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const { auth } = require('../../../shared/middleware/auth');

// ============================================
// UNREAD COUNT (Must be before /:id routes)
// ============================================

/**
 * @route   GET /api/v1/notifications/unread/count
 * @desc    Get unread notification counts by type
 * @access  Private
 */
router.get('/unread/count', auth, notificationController.getUnreadCount);

// ============================================
// BULK ACTIONS (Must be before /:id routes)
// ============================================

/**
 * @route   POST /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all', auth, notificationController.markAllAsRead);

/**
 * @route   DELETE /api/v1/notifications/old
 * @desc    Delete old read notifications
 * @access  Private
 * @query   { daysOld?: number }
 */
router.delete('/old', auth, notificationController.deleteOldNotifications);

// ============================================
// NOTIFICATION LIST
// ============================================

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 * @query   { type?, unreadOnly?, page?, limit? }
 */
router.get('/', auth, notificationController.getNotifications);

// ============================================
// NOTIFICATION BY ID ROUTES
// ============================================

/**
 * @route   GET /api/v1/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', auth, notificationController.getNotificationById);

/**
 * @route   POST /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read', auth, notificationController.markAsRead);

/**
 * @route   POST /api/v1/notifications/:id/click
 * @desc    Mark notification as clicked (also marks as read)
 * @access  Private
 */
router.post('/:id/click', auth, notificationController.markAsClicked);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', auth, notificationController.deleteNotification);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
