/**
 * @fileoverview Trial Controller
 *
 * Handles all trial collaboration-related HTTP endpoints:
 * - Proposing and managing trials
 * - Accepting/declining trials
 * - Feedback collection
 * - Trial queries
 *
 * @module controllers/trial
 */

const trialService = require('../services/trial.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// TRIAL LIFECYCLE
// ============================================

/**
 * Propose a trial in a conversation
 *
 * @route POST /api/v1/trials/propose
 * @access Private (Conversation participants only)
 *
 * @param {string} req.body.conversationId - Conversation ID
 * @param {number} req.body.durationDays - 7, 14, or 21 days
 * @param {string} req.body.goal - Trial goal/deliverable
 * @param {string} [req.body.checkinFrequency='WEEKLY'] - Check-in frequency
 *
 * @returns {Object} Created trial
 */
const proposeTrial = asyncHandler(async (req, res) => {
  const proposerId = req.user._id;
  const { conversationId, durationDays, goal, checkinFrequency } = req.body;

  const trial = await trialService.proposeTrial(conversationId, proposerId, {
    durationDays,
    goal,
    checkinFrequency,
  });

  return ApiResponse.created('Trial proposed successfully', { trial }).send(res);
});

/**
 * Accept a trial proposal
 *
 * @route POST /api/v1/trials/:id/accept
 * @access Private (Trial participants only)
 *
 * @param {string} req.params.id - Trial ID
 *
 * @returns {Object} Updated trial
 */
const acceptTrial = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const trial = await trialService.acceptTrial(id, userId);

  return ApiResponse.ok('Trial accepted - let\'s get started!', { trial }).send(res);
});

/**
 * Decline a trial proposal
 *
 * @route POST /api/v1/trials/:id/decline
 * @access Private (Trial participants only)
 *
 * @param {string} req.params.id - Trial ID
 *
 * @returns {Object} Updated trial
 */
const declineTrial = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const trial = await trialService.declineTrial(id, userId);

  return ApiResponse.ok('Trial proposal declined', { trial }).send(res);
});

/**
 * Cancel an active or proposed trial
 *
 * @route POST /api/v1/trials/:id/cancel
 * @access Private (Trial participants only)
 *
 * @param {string} req.params.id - Trial ID
 * @param {string} [req.body.reason] - Cancellation reason
 *
 * @returns {Object} Updated trial
 */
const cancelTrial = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { reason } = req.body;

  const trial = await trialService.cancelTrial(id, userId, reason);

  return ApiResponse.ok('Trial cancelled', { trial }).send(res);
});

/**
 * Complete a trial (manually trigger completion)
 *
 * @route POST /api/v1/trials/:id/complete
 * @access Private (Trial participants only)
 *
 * @param {string} req.params.id - Trial ID
 *
 * @returns {Object} Updated trial
 */
const completeTrial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trial = await trialService.completeTrial(id);

  return ApiResponse.ok('Trial completed - please provide feedback', { trial }).send(res);
});

// ============================================
// FEEDBACK
// ============================================

/**
 * Submit feedback for a completed trial
 *
 * @route POST /api/v1/trials/:id/feedback
 * @access Private (Trial participants only)
 *
 * @param {string} req.params.id - Trial ID
 * @param {number} req.body.communication - 1-5 rating
 * @param {number} req.body.reliability - 1-5 rating
 * @param {number} req.body.skillMatch - 1-5 rating
 * @param {boolean} req.body.wouldContinue - Would continue working together
 * @param {string} [req.body.privateNotes] - Private notes
 *
 * @returns {Object} Updated trial
 */
const submitFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { communication, reliability, skillMatch, wouldContinue, privateNotes } = req.body;

  const trial = await trialService.submitFeedback(id, userId, {
    communication,
    reliability,
    skillMatch,
    wouldContinue,
    privateNotes,
  });

  return ApiResponse.ok('Feedback submitted successfully', { trial }).send(res);
});

// ============================================
// QUERIES
// ============================================

/**
 * Get trial by ID
 *
 * @route GET /api/v1/trials/:id
 * @access Private (Trial participants only)
 *
 * @param {string} req.params.id - Trial ID
 *
 * @returns {Object} Trial details
 */
const getTrialById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const trial = await trialService.getTrialById(id, userId);

  return ApiResponse.ok('Trial retrieved', { trial }).send(res);
});

/**
 * Get all trials for current user
 *
 * @route GET /api/v1/trials
 * @access Private
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated trials
 */
const getUserTrials = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await trialService.getUserTrials(userId, {
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.trials,
    result.pagination,
    'Trials retrieved'
  ).send(res);
});

/**
 * Get active trials for current user
 *
 * @route GET /api/v1/trials/active
 * @access Private
 *
 * @returns {Object} Active trials
 */
const getActiveTrials = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const trials = await trialService.getActiveTrials(userId);

  return ApiResponse.ok('Active trials retrieved', { trials, count: trials.length }).send(res);
});

/**
 * Get trial for a specific conversation
 *
 * @route GET /api/v1/trials/conversation/:conversationId
 * @access Private (Conversation participants only)
 *
 * @param {string} req.params.conversationId - Conversation ID
 *
 * @returns {Object} Trial or null
 */
const getTrialForConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  const trial = await trialService.getTrialForConversation(conversationId, userId);

  return ApiResponse.ok('Trial retrieved', { trial }).send(res);
});

/**
 * Get trial statistics for current user
 *
 * @route GET /api/v1/trials/stats
 * @access Private
 *
 * @returns {Object} Trial statistics
 */
const getTrialStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await trialService.getTrialStats(userId);

  return ApiResponse.ok('Trial statistics retrieved', stats).send(res);
});

// ============================================
// ADMIN
// ============================================

/**
 * Get trials ending soon (admin)
 *
 * @route GET /api/v1/trials/admin/ending-soon
 * @access Private (Admin only)
 *
 * @param {number} [req.query.daysAhead=2] - Days to look ahead
 *
 * @returns {Object} Trials ending soon
 */
const getTrialsEndingSoon = asyncHandler(async (req, res) => {
  const daysAhead = parseInt(req.query.daysAhead, 10) || 2;

  const trials = await trialService.getTrialsEndingSoon(daysAhead);

  return ApiResponse.ok('Trials ending soon retrieved', { trials, count: trials.length }).send(res);
});

/**
 * Trigger auto-completion of expired trials (admin)
 *
 * @route POST /api/v1/trials/admin/auto-complete
 * @access Private (Admin only)
 *
 * @returns {Object} Number of trials completed
 */
const autoCompleteExpiredTrials = asyncHandler(async (req, res) => {
  const count = await trialService.autoCompleteExpiredTrials();

  return ApiResponse.ok('Expired trials auto-completed', { completedCount: count }).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Lifecycle
  proposeTrial,
  acceptTrial,
  declineTrial,
  cancelTrial,
  completeTrial,

  // Feedback
  submitFeedback,

  // Queries
  getTrialById,
  getUserTrials,
  getActiveTrials,
  getTrialForConversation,
  getTrialStats,

  // Admin
  getTrialsEndingSoon,
  autoCompleteExpiredTrials,
};
