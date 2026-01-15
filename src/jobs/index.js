/**
 * @fileoverview Jobs Module Index
 *
 * Exports all job-related functionality.
 *
 * @module jobs
 */

const scheduler = require('./scheduler');
const matchGenerationJob = require('./matchGeneration.job');
const trialAutoCompleteJob = require('./trialAutoComplete.job');
const trialRemindersJob = require('./trialReminders.job');
const cleanupJob = require('./cleanup.job');

module.exports = {
  // Scheduler
  scheduler,

  // Individual jobs
  matchGenerationJob,
  trialAutoCompleteJob,
  trialRemindersJob,
  cleanupJob,

  // Convenience methods
  initialize: scheduler.initialize,
  shutdown: scheduler.shutdown,
  runJob: scheduler.runJob,
  getJobStatuses: scheduler.getJobStatuses,
};
