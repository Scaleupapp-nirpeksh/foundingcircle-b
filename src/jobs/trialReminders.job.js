/**
 * @fileoverview Trial Reminders Job
 *
 * Runs daily to send reminders for trials ending soon.
 * Notifies both founder and builder about upcoming trial completion.
 *
 * Schedule: Daily at 9 AM
 *
 * @module jobs/trialReminders
 */

const trialService = require('../modules/trial/services/trial.service');
const notificationService = require('../modules/notification/services/notification.service');
const { Conversation } = require('../modules/models');
const logger = require('../shared/utils/logger');

/**
 * Calculate days remaining for a trial
 *
 * @param {Date} endsAt - Trial end date
 * @returns {number} Days remaining
 */
const getDaysRemaining = (endsAt) => {
  const now = new Date();
  const end = new Date(endsAt);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Run the trial reminders job
 *
 * @returns {Promise<Object>} Job results
 */
const run = async () => {
  logger.info('⏰ Starting trial reminders job...');

  try {
    // Get trials ending in next 2 days
    const trialsEndingSoon = await trialService.getTrialsEndingSoon(2);

    let remindersSent = 0;
    const errors = [];

    for (const trial of trialsEndingSoon) {
      try {
        const daysRemaining = getDaysRemaining(trial.endsAt);

        // Get conversation to find participants
        const conversation = await Conversation.findById(trial.conversation);

        if (!conversation) {
          logger.warn('Conversation not found for trial', { trialId: trial._id });
          continue;
        }

        // Send reminder to founder
        await notificationService.notifyTrialReminder({
          userId: conversation.founder,
          trial,
          conversation,
          daysRemaining,
        });
        remindersSent++;

        // Send reminder to builder
        await notificationService.notifyTrialReminder({
          userId: conversation.builder,
          trial,
          conversation,
          daysRemaining,
        });
        remindersSent++;

        logger.info('Trial reminder sent', {
          trialId: trial._id,
          daysRemaining,
        });
      } catch (notifError) {
        errors.push({
          trialId: trial._id,
          error: notifError.message,
        });

        logger.warn('Failed to send trial reminder', {
          trialId: trial._id,
          error: notifError.message,
        });
      }
    }

    logger.info('⏰ Trial reminders job completed', {
      trialsFound: trialsEndingSoon.length,
      remindersSent,
      errorCount: errors.length,
    });

    return {
      success: true,
      trialsFound: trialsEndingSoon.length,
      remindersSent,
      errorCount: errors.length,
    };
  } catch (error) {
    logger.error('⏰ Trial reminders job failed', {
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
  name: 'Trial Reminders',
};
