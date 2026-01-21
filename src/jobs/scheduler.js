/**
 * @fileoverview Job Scheduler
 *
 * Centralized job scheduler using node-cron.
 * Manages all background jobs and their schedules.
 *
 * @module jobs/scheduler
 */

const cron = require('node-cron');
const logger = require('../shared/utils/logger');
const { config } = require('../shared/config');

// Import individual jobs
const matchGenerationJob = require('./matchGeneration.job');
const trialAutoCompleteJob = require('./trialAutoComplete.job');
const trialRemindersJob = require('./trialReminders.job');
const cleanupJob = require('./cleanup.job');

// ============================================
// JOB REGISTRY
// ============================================

/**
 * Registry of all scheduled jobs
 * Each job has: name, schedule, handler, enabled flag
 */
const jobs = [
  {
    name: 'Nightly Match Generation',
    schedule: config.cron?.matchingSchedule || '0 2 * * *', // 2 AM daily
    handler: matchGenerationJob.run,
    enabled: true,
  },
  {
    name: 'Trial Auto-Completion',
    schedule: '0 3 * * *', // 3 AM daily
    handler: trialAutoCompleteJob.run,
    enabled: true,
  },
  {
    name: 'Trial Reminders',
    schedule: '0 9 * * *', // 9 AM daily
    handler: trialRemindersJob.run,
    enabled: true,
  },
  {
    name: 'OTP Cleanup',
    schedule: '0 4 * * *', // 4 AM daily
    handler: cleanupJob.cleanupOTPs,
    enabled: true,
  },
  {
    name: 'Notification Cleanup',
    schedule: '0 5 * * *', // 5 AM daily
    handler: cleanupJob.cleanupNotifications,
    enabled: true,
  },
];

// Store scheduled task references for management
const scheduledTasks = new Map();

// ============================================
// SCHEDULER FUNCTIONS
// ============================================

/**
 * Initialize and start all scheduled jobs
 */
const initialize = () => {
  logger.info('🕐 Initializing job scheduler...');

  let enabledCount = 0;

  jobs.forEach((job) => {
    if (!job.enabled) {
      logger.info(`⏸️  Job "${job.name}" is disabled, skipping`);
      return;
    }

    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      logger.error(`❌ Invalid cron expression for "${job.name}": ${job.schedule}`);
      return;
    }

    // Schedule the job
    const task = cron.schedule(
      job.schedule,
      async () => {
        const startTime = Date.now();
        logger.info(`🚀 Starting job: ${job.name}`);

        try {
          const result = await job.handler();
          const duration = Date.now() - startTime;

          logger.info(`✅ Job "${job.name}" completed in ${duration}ms`, {
            job: job.name,
            duration,
            result,
          });
        } catch (error) {
          const duration = Date.now() - startTime;

          logger.error(`❌ Job "${job.name}" failed after ${duration}ms`, {
            job: job.name,
            duration,
            error: error.message,
            stack: error.stack,
          });
        }
      },
      {
        scheduled: true,
        timezone: config.timezone || 'Asia/Kolkata',
      }
    );

    scheduledTasks.set(job.name, task);
    enabledCount++;

    logger.info(`📅 Scheduled: "${job.name}" at "${job.schedule}"`);
  });

  logger.info(`🕐 Job scheduler initialized with ${enabledCount} jobs`);
};

/**
 * Stop all scheduled jobs
 */
const shutdown = () => {
  logger.info('🛑 Shutting down job scheduler...');

  scheduledTasks.forEach((task, name) => {
    task.stop();
    logger.info(`⏹️  Stopped job: ${name}`);
  });

  scheduledTasks.clear();
  logger.info('🛑 Job scheduler shutdown complete');
};

/**
 * Run a specific job manually
 *
 * @param {string} jobName - Name of the job to run
 * @returns {Promise<Object>} Job result
 */
const runJob = async (jobName) => {
  const job = jobs.find((j) => j.name === jobName);

  if (!job) {
    throw new Error(`Job "${jobName}" not found`);
  }

  logger.info(`🔧 Manually running job: ${jobName}`);

  const startTime = Date.now();
  const result = await job.handler();
  const duration = Date.now() - startTime;

  logger.info(`✅ Manual job "${jobName}" completed in ${duration}ms`, { result });

  return { job: jobName, duration, result };
};

/**
 * Get status of all jobs
 *
 * @returns {Array} Job statuses
 */
const getJobStatuses = () => {
  return jobs.map((job) => ({
    name: job.name,
    schedule: job.schedule,
    enabled: job.enabled,
    isRunning: scheduledTasks.has(job.name),
  }));
};

/**
 * Enable a specific job
 *
 * @param {string} jobName - Name of the job
 */
const enableJob = (jobName) => {
  const job = jobs.find((j) => j.name === jobName);
  if (job) {
    job.enabled = true;
    logger.info(`✅ Enabled job: ${jobName}`);
  }
};

/**
 * Disable a specific job
 *
 * @param {string} jobName - Name of the job
 */
const disableJob = (jobName) => {
  const job = jobs.find((j) => j.name === jobName);
  if (job) {
    job.enabled = false;
    const task = scheduledTasks.get(jobName);
    if (task) {
      task.stop();
      scheduledTasks.delete(jobName);
    }
    logger.info(`⏸️  Disabled job: ${jobName}`);
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  initialize,
  shutdown,
  runJob,
  getJobStatuses,
  enableJob,
  disableJob,
  jobs,
};
