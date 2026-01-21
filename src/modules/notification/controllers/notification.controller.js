/**
 * @fileoverview Notification Controller
 *
 * Handles all notification-related HTTP endpoints:
 * - Fetching user notifications
 * - Marking notifications as read
 * - Deleting notifications
 *
 * @module controllers/notification
 */

const notificationService = require('../services/notification.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// NOTIFICATION QUERIES
// ============================================

/**
 * Get notifications for current user
 *
 * @route GET /api/v1/notifications
 * @access Private
 *
 * @param {string} [req.query.type] - Filter by notification type
 * @param {boolean} [req.query.unreadOnly] - Only return unread notifications
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type, unreadOnly, page = 1, limit = 20 } = req.query;

  const result = await notificationService.getUserNotifications(userId, {
    type,
    unreadOnly: unreadOnly === 'true',
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.notifications,
    result.pagination,
    'Notifications retrieved'
  ).send(res);
});

/**
 * Get unread notification count
 *
 * @route GET /api/v1/notifications/unread/count
 * @access Private
 *
 * @returns {Object} Unread counts by type
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const counts = await notificationService.getUnreadCount(userId);

  return ApiResponse.ok('Unread count retrieved', counts).send(res);
});

/**
 * Get notification by ID
 *
 * @route GET /api/v1/notifications/:id
 * @access Private
 *
 * @param {string} req.params.id - Notification ID
 *
 * @returns {Object} Notification details
 */
const getNotificationById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const notification = await notificationService.getNotificationById(id, userId);

  return ApiResponse.ok('Notification retrieved', { notification }).send(res);
});

// ============================================
// NOTIFICATION ACTIONS
// ============================================

/**
 * Mark notification as read
 *
 * @route POST /api/v1/notifications/:id/read
 * @access Private
 *
 * @param {string} req.params.id - Notification ID
 *
 * @returns {Object} Updated notification
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const notification = await notificationService.markAsRead(id, userId);

  return ApiResponse.ok('Notification marked as read', { notification }).send(res);
});

/**
 * Mark notification as clicked
 *
 * @route POST /api/v1/notifications/:id/click
 * @access Private
 *
 * @param {string} req.params.id - Notification ID
 *
 * @returns {Object} Updated notification
 */
const markAsClicked = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const notification = await notificationService.markAsClicked(id, userId);

  return ApiResponse.ok('Notification marked as clicked', { notification }).send(res);
});

/**
 * Mark all notifications as read
 *
 * @route POST /api/v1/notifications/read-all
 * @access Private
 *
 * @returns {Object} Number of notifications marked as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await notificationService.markAllAsRead(userId);

  return ApiResponse.ok('All notifications marked as read', { count }).send(res);
});

/**
 * Delete a notification
 *
 * @route DELETE /api/v1/notifications/:id
 * @access Private
 *
 * @param {string} req.params.id - Notification ID
 *
 * @returns {Object} Success message
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  await notificationService.deleteNotification(id, userId);

  return ApiResponse.ok('Notification deleted').send(res);
});

/**
 * Delete old read notifications
 *
 * @route DELETE /api/v1/notifications/old
 * @access Private
 *
 * @param {number} [req.query.daysOld=30] - Delete notifications older than this
 *
 * @returns {Object} Number of notifications deleted
 */
const deleteOldNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { daysOld = 30 } = req.query;

  const count = await notificationService.deleteOldNotifications(
    userId,
    parseInt(daysOld, 10)
  );

  return ApiResponse.ok('Old notifications deleted', { count }).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Queries
  getNotifications,
  getUnreadCount,
  getNotificationById,

  // Actions
  markAsRead,
  markAsClicked,
  markAllAsRead,
  deleteNotification,
  deleteOldNotifications,
};
