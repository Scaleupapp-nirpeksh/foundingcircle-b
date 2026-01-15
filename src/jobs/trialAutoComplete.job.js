/**
 * @fileoverview Trial Auto-Completion Job
 *
 * Runs daily to automatically complete trials that have expired.
 * Sends notifications to both participants prompting them for feedback.
 *
 * Schedule: Daily at 3 AM
 *
 * @module jobs/trialAutoComplete
 */

const trialService = require('../services/trial.service');
const notificationService = require('../services/notification.service');
const { Trial, Conversation } = require('../models');
const logger = require('../utils/logger');

/**
 * Run the trial auto-completion job
 *
 * @returns {Promise<Object>} Job results
 */
const run = async () => {
  logger.info('🧪 Starting trial auto-completion...');

  try {
    const count = await trialService.autoCompleteExpiredTrials();

    // If trials were completed, send notifications
    if (count > 0) {
      // Get recently completed trials to send notifications
      const recentlyCompleted = await Trial.find({
        status: 'COMPLETED',
        completedAt: {
          $gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      }).populate('conversation');

      let notificationsSent = 0;

      for (const trial of recentlyCompleted) {
        try {
          // Get conversation to find participants
          const conversation = await Conversation.findById(trial.conversation);

          if (conversation) {
            // Notify founder
            await notificationService.notifyTrialCompleted({
              userId: conversation.founder,
              trial,
              conversation,
            });

            // Notify builder
            await notificationService.notifyTrialCompleted({
              userId: conversation.builder,
              trial,
              conversation,
            });

            notificationsSent += 2;
          }
        } catch (notifError) {
          logger.warn('Failed to send trial completion notification', {
            trialId: trial._id,
            error: notifError.message,
          });
        }
      }

      logger.info('🧪 Trial auto-completion notifications sent', {
        notificationsSent,
      });
    }

    logger.info('🧪 Trial auto-completion completed', {
      trialsCompleted: count,
    });

    return {
      success: true,
      trialsCompleted: count,
    };
  } catch (error) {
    logger.error('🧪 Trial auto-completion failed', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  run,
  name: 'Trial Auto-Completion',
};
