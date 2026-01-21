/**
 * @fileoverview Cleanup Jobs
 *
 * Contains various cleanup jobs for maintaining database hygiene:
 * - OTP cleanup (expired/old OTPs)
 * - Notification cleanup (old read notifications)
 *
 * @module jobs/cleanup
 */

const { Notification, User } = require('../modules/models');
const logger = require('../shared/utils/logger');

// ============================================
// OTP CLEANUP
// ============================================

/**
 * Clean up old OTP records
 *
 * Schedule: Daily at 4 AM
 *
 * @returns {Promise<Object>} Cleanup results
 */
const cleanupOTPs = async () => {
  logger.info('🧹 Starting OTP cleanup...');

  try {
    // Import OTP model directly to access static method
    const OTP = require('../modules/auth/models/OTP');

    // Clean up OTPs older than 7 days
    const deletedCount = await OTP.cleanupOldRecords(7);

    logger.info('🧹 OTP cleanup completed', {
      deletedCount,
    });

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    logger.error('🧹 OTP cleanup failed', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================
// NOTIFICATION CLEANUP
// ============================================

/**
 * Clean up old read notifications for all users
 *
 * Schedule: Daily at 5 AM
 *
 * @returns {Promise<Object>} Cleanup results
 */
const cleanupNotifications = async () => {
  logger.info('🧹 Starting notification cleanup...');

  try {
    // Delete read notifications older than 30 days globally
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await Notification.deleteMany({
      read: true,
      createdAt: { $lt: cutoffDate },
    });

    logger.info('🧹 Notification cleanup completed', {
      deletedCount: result.deletedCount,
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    logger.error('🧹 Notification cleanup failed', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================
// EXPIRED SESSIONS CLEANUP (Future)
// ============================================

/**
 * Clean up expired user sessions
 * Placeholder for future implementation
 *
 * @returns {Promise<Object>} Cleanup results
 */
const cleanupExpiredSessions = async () => {
  logger.info('🧹 Starting session cleanup...');

  try {
    // Placeholder - implement when session management is added
    // This would clean up expired refresh tokens, sessions, etc.

    logger.info('🧹 Session cleanup completed (no-op)');

    return {
      success: true,
      deletedCount: 0,
      message: 'Session cleanup not yet implemented',
    };
  } catch (error) {
    logger.error('🧹 Session cleanup failed', {
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================
// ORPHANED RECORDS CLEANUP (Future)
// ============================================

/**
 * Clean up orphaned records
 * Placeholder for future implementation
 *
 * @returns {Promise<Object>} Cleanup results
 */
const cleanupOrphanedRecords = async () => {
  logger.info('🧹 Starting orphaned records cleanup...');

  try {
    // Placeholder - could clean up:
    // - Messages in deleted conversations
    // - Interests for deleted openings
    // - Trials for deleted conversations
    // etc.

    logger.info('🧹 Orphaned records cleanup completed (no-op)');

    return {
      success: true,
      deletedCount: 0,
      message: 'Orphaned records cleanup not yet implemented',
    };
  } catch (error) {
    logger.error('🧹 Orphaned records cleanup failed', {
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  cleanupOTPs,
  cleanupNotifications,
  cleanupExpiredSessions,
  cleanupOrphanedRecords,
};
