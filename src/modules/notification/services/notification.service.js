/**
 * @fileoverview Notification Service
 *
 * Handles all notification-related business logic:
 * - Creating notifications
 * - Fetching user notifications
 * - Marking notifications as read
 * - Real-time notification delivery via sockets
 *
 * @module services/notification
 */

const { Notification, User } = require('../../models');
const { NOTIFICATION_TYPES } = require('../../../shared/constants/enums');
const { ERROR_CODES } = require('../../../shared/constants');
const { AppError } = require('../../../shared/middleware/errorHandler');
const socketService = require('../../../socket/socketService');

// ============================================
// NOTIFICATION CREATION
// ============================================

/**
 * Create a notification and emit via socket
 *
 * @param {Object} params - Notification parameters
 * @param {ObjectId} params.userId - User to notify
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {Object} [params.data] - Additional data
 * @param {string} [params.priority] - Priority level
 * @param {string} [params.actionUrl] - Deep link URL
 * @param {Date} [params.expiresAt] - Expiration date
 * @returns {Object} Created notification
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  priority = 'NORMAL',
  actionUrl,
  expiresAt,
}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
    priority,
    actionUrl,
    expiresAt,
  });

  // Emit real-time notification
  socketService.emitNotification(userId.toString(), notification);

  // Also update unread count
  const unreadCounts = await Notification.getUnreadCountsByType(userId);
  socketService.emitUnreadCountUpdate(userId.toString(), unreadCounts);

  return notification;
};

// ============================================
// SPECIFIC NOTIFICATION CREATORS
// ============================================

/**
 * Create notification for new interest (sent to founder)
 */
const notifyNewInterest = async ({ founderId, builder, opening, interestId }) => {
  return createNotification({
    userId: founderId,
    type: NOTIFICATION_TYPES.NEW_INTEREST,
    title: 'New Interest',
    message: `${builder.name} is interested in your ${opening.title} opening`,
    data: {
      interestId,
      openingId: opening._id,
      openingTitle: opening.title,
      actorId: builder._id,
      actorName: builder.name,
      actorAvatar: builder.avatarUrl,
    },
    actionUrl: `/interests/${interestId}`,
  });
};

/**
 * Create notification for builder being shortlisted
 */
const notifyShortlisted = async ({ builderId, founder, opening, interestId }) => {
  return createNotification({
    userId: builderId,
    type: NOTIFICATION_TYPES.SHORTLISTED,
    title: 'You\'ve been shortlisted!',
    message: `${founder.name} shortlisted you for ${opening.title}`,
    data: {
      interestId,
      openingId: opening._id,
      openingTitle: opening.title,
      actorId: founder._id,
      actorName: founder.name,
      actorAvatar: founder.avatarUrl,
    },
    priority: 'HIGH',
    actionUrl: `/interests/${interestId}`,
  });
};

/**
 * Create notification for new match
 */
const notifyNewMatch = async ({ userId, otherUser, match, opening }) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.NEW_MATCH,
    title: 'It\'s a Match!',
    message: `You matched with ${otherUser.name} for ${opening.title}`,
    data: {
      matchId: match._id,
      openingId: opening._id,
      openingTitle: opening.title,
      actorId: otherUser._id,
      actorName: otherUser.name,
      actorAvatar: otherUser.avatarUrl,
    },
    priority: 'HIGH',
    actionUrl: `/matches/${match._id}`,
  });
};

/**
 * Create notification for new message
 */
const notifyNewMessage = async ({ userId, sender, conversation, messagePreview }) => {
  // Don't create notification if user is currently in the conversation
  // This check can be enhanced by checking socket rooms

  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    title: `Message from ${sender.name}`,
    message: messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
    data: {
      conversationId: conversation._id,
      actorId: sender._id,
      actorName: sender.name,
      actorAvatar: sender.avatarUrl,
      messagePreview,
    },
    actionUrl: `/conversations/${conversation._id}`,
  });
};

/**
 * Create notification for trial proposal
 */
const notifyTrialProposed = async ({ userId, proposer, trial, conversation }) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.TRIAL_PROPOSED,
    title: 'Trial Proposal',
    message: `${proposer.name} proposed a ${trial.durationDays}-day trial`,
    data: {
      trialId: trial._id,
      conversationId: conversation._id,
      actorId: proposer._id,
      actorName: proposer.name,
      actorAvatar: proposer.avatarUrl,
      trialStatus: trial.status,
    },
    priority: 'HIGH',
    actionUrl: `/conversations/${conversation._id}`,
  });
};

/**
 * Create notification for trial acceptance
 */
const notifyTrialAccepted = async ({ userId, accepter, trial, conversation }) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.TRIAL_ACCEPTED,
    title: 'Trial Started!',
    message: `${accepter.name} accepted your trial proposal`,
    data: {
      trialId: trial._id,
      conversationId: conversation._id,
      actorId: accepter._id,
      actorName: accepter.name,
      actorAvatar: accepter.avatarUrl,
      trialStatus: trial.status,
    },
    priority: 'HIGH',
    actionUrl: `/conversations/${conversation._id}`,
  });
};

/**
 * Create notification for trial completion
 */
const notifyTrialCompleted = async ({ userId, trial, conversation }) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.TRIAL_COMPLETED,
    title: 'Trial Completed',
    message: 'Your trial has ended. Please provide feedback.',
    data: {
      trialId: trial._id,
      conversationId: conversation._id,
      trialStatus: trial.status,
    },
    priority: 'HIGH',
    actionUrl: `/trials/${trial._id}/feedback`,
  });
};

/**
 * Create notification for trial reminder
 */
const notifyTrialReminder = async ({ userId, trial, conversation, daysRemaining }) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.TRIAL_REMINDER,
    title: 'Trial Ending Soon',
    message: `Your trial ends in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
    data: {
      trialId: trial._id,
      conversationId: conversation._id,
      trialStatus: trial.status,
    },
    actionUrl: `/conversations/${conversation._id}`,
  });
};

/**
 * Create system notification
 */
const notifySystem = async ({ userId, title, message, data = {}, actionUrl }) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.SYSTEM,
    title,
    message,
    data,
    actionUrl,
  });
};

// ============================================
// NOTIFICATION QUERIES
// ============================================

/**
 * Get notifications for a user
 *
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @param {string} [options.type] - Filter by type
 * @param {boolean} [options.unreadOnly] - Only unread notifications
 * @param {number} [options.page] - Page number
 * @param {number} [options.limit] - Items per page
 * @returns {Object} Paginated notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  const { type, unreadOnly = false, page = 1, limit = 20 } = options;

  const query = { user: userId };

  if (type) {
    query.type = type;
  }

  if (unreadOnly) {
    query.read = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

/**
 * Get unread notification count
 *
 * @param {ObjectId} userId - User ID
 * @returns {Object} Unread counts
 */
const getUnreadCount = async (userId) => {
  return Notification.getUnreadCountsByType(userId);
};

/**
 * Get notification by ID
 *
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID (for validation)
 * @returns {Object} Notification
 */
const getNotificationById = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError('Notification not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  if (notification.user.toString() !== userId.toString()) {
    throw new AppError('Not authorized to access this notification', 403);
  }

  return notification;
};

// ============================================
// NOTIFICATION ACTIONS
// ============================================

/**
 * Mark a notification as read
 *
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID
 * @returns {Object} Updated notification
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await getNotificationById(notificationId, userId);
  await notification.markAsRead();

  // Update unread count
  const unreadCounts = await Notification.getUnreadCountsByType(userId);
  socketService.emitUnreadCountUpdate(userId.toString(), unreadCounts);

  return notification;
};

/**
 * Mark a notification as clicked
 *
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID
 * @returns {Object} Updated notification
 */
const markAsClicked = async (notificationId, userId) => {
  const notification = await getNotificationById(notificationId, userId);
  await notification.markAsClicked();

  // Update unread count
  const unreadCounts = await Notification.getUnreadCountsByType(userId);
  socketService.emitUnreadCountUpdate(userId.toString(), unreadCounts);

  return notification;
};

/**
 * Mark all notifications as read for a user
 *
 * @param {ObjectId} userId - User ID
 * @returns {number} Number marked as read
 */
const markAllAsRead = async (userId) => {
  const count = await Notification.markAllAsRead(userId);

  // Update unread count
  const unreadCounts = await Notification.getUnreadCountsByType(userId);
  socketService.emitUnreadCountUpdate(userId.toString(), unreadCounts);

  return count;
};

/**
 * Delete a notification
 *
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID
 * @returns {boolean} Success
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await getNotificationById(notificationId, userId);
  await notification.deleteOne();
  return true;
};

/**
 * Delete old read notifications
 *
 * @param {ObjectId} userId - User ID
 * @param {number} daysOld - Delete notifications older than this
 * @returns {number} Number deleted
 */
const deleteOldNotifications = async (userId, daysOld = 30) => {
  return Notification.deleteOldNotifications(userId, daysOld);
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Core creation
  createNotification,

  // Specific notification creators
  notifyNewInterest,
  notifyShortlisted,
  notifyNewMatch,
  notifyNewMessage,
  notifyTrialProposed,
  notifyTrialAccepted,
  notifyTrialCompleted,
  notifyTrialReminder,
  notifySystem,

  // Queries
  getUserNotifications,
  getUnreadCount,
  getNotificationById,

  // Actions
  markAsRead,
  markAsClicked,
  markAllAsRead,
  deleteNotification,
  deleteOldNotifications,
};
