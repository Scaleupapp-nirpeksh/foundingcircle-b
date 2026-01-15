/**
 * @fileoverview Nightly Match Generation Job
 *
 * Runs daily to generate matches between builders and openings.
 * Uses the matching algorithm to calculate compatibility scores.
 *
 * Schedule: Daily at 2 AM
 *
 * @module jobs/matchGeneration
 */

const matchingService = require('../services/matching.service');
const logger = require('../utils/logger');

/**
 * Run the nightly match generation job
 *
 * @returns {Promise<Object>} Job results
 */
const run = async () => {
  logger.info('🎯 Starting nightly match generation...');

  try {
    const result = await matchingService.runNightlyMatchGeneration();

    logger.info('🎯 Nightly match generation completed', {
      openingsProcessed: result.openingsProcessed,
      matchesCreated: result.matchesCreated,
      matchesUpdated: result.matchesUpdated,
      errors: result.errors?.length || 0,
    });

    // Log any errors that occurred
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((err) => {
        logger.warn('Match generation error for opening', {
          openingId: err.openingId,
          error: err.error,
        });
      });
    }

    return {
      success: true,
      openingsProcessed: result.openingsProcessed,
      matchesCreated: result.matchesCreated,
      matchesUpdated: result.matchesUpdated,
      errorCount: result.errors?.length || 0,
    };
  } catch (error) {
    logger.error('🎯 Nightly match generation failed', {
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
  name: 'Nightly Match Generation',
};
