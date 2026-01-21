/**
 * @fileoverview Notification Model
 *
 * Stores in-app notifications for users including:
 * - New matches
 * - New interests
 * - Messages
 * - Trial updates
 * - System notifications
 *
 * @module models/Notification
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../../../shared/constants/enums');

// ============================================
// SCHEMA DEFINITION
// ============================================

const notificationSchema = new mongoose.Schema(
  {
    /**
     * User who receives this notification
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },

    /**
     * Type of notification
     */
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Notification type is required'],
      index: true,
    },

    /**
     * Notification title (short summary)
     */
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    /**
     * Notification message (detailed text)
     */
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    /**
     * Additional data associated with the notification
     * Structure varies by notification type
     */
    data: {
      // Reference IDs for navigation
      conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
      },
      interestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interest',
      },
      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
      },
      trialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trial',
      },
      openingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opening',
      },
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },

      // Actor information (who triggered the notification)
      actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      actorName: String,
      actorAvatar: String,

      // Additional context
      openingTitle: String,
      trialStatus: String,
      messagePreview: String,
    },

    /**
     * Whether the notification has been read
     */
    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * When the notification was read
     */
    readAt: {
      type: Date,
    },

    /**
     * Whether the notification has been clicked/actioned
     */
    clicked: {
      type: Boolean,
      default: false,
    },

    /**
     * When the notification was clicked
     */
    clickedAt: {
      type: Date,
    },

    /**
     * URL/path for deep linking in the app
     */
    actionUrl: {
      type: String,
    },

    /**
     * Notification priority
     */
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },

    /**
     * Expiration date for time-sensitive notifications
     */
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

// Compound index for user notifications query (most common)
notificationSchema.index({ user: 1, createdAt: -1 });

// Index for unread notifications
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Index for notification type filtering
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });

// TTL index for automatic cleanup of expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = async function () {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

/**
 * Mark notification as clicked
 */
notificationSchema.methods.markAsClicked = async function () {
  this.clicked = true;
  this.clickedAt = new Date();
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
  }
  await this.save();
  return this;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get unread count for a user
 * @param {ObjectId} userId - User ID
 * @returns {number} Unread count
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ user: userId, read: false });
};

/**
 * Get unread counts by type for a user
 * @param {ObjectId} userId - User ID
 * @returns {Object} Counts by type
 */
notificationSchema.statics.getUnreadCountsByType = async function (userId) {
  const result = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), read: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const counts = {
    total: 0,
    byType: {},
  };

  result.forEach((item) => {
    counts.byType[item._id] = item.count;
    counts.total += item.count;
  });

  return counts;
};

/**
 * Mark all notifications as read for a user
 * @param {ObjectId} userId - User ID
 * @returns {number} Number of notifications marked as read
 */
notificationSchema.statics.markAllAsRead = async function (userId) {
  const result = await this.updateMany(
    { user: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return result.modifiedCount;
};

/**
 * Delete old notifications for a user
 * @param {ObjectId} userId - User ID
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {number} Number of notifications deleted
 */
notificationSchema.statics.deleteOldNotifications = async function (userId, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    user: userId,
    read: true,
    createdAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if notification is expired
 */
notificationSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

/**
 * Time since notification was created
 */
notificationSchema.virtual('age').get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Enable virtuals in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// ============================================
// MODEL EXPORT
// ============================================

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
