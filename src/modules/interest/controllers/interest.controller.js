/**
 * @fileoverview Interest Controller
 *
 * Handles all interest/matching-related HTTP endpoints:
 * - Builder expressing/withdrawing interest
 * - Founder shortlisting/passing on builders
 * - Mutual match management
 * - Interest analytics
 *
 * @module controllers/interest
 */

const interestService = require('../services/interest.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// BUILDER ACTIONS
// ============================================

/**
 * Express interest in an opening
 *
 * @route POST /api/v1/interests/openings/:openingId
 * @access Private (Builders only)
 *
 * @param {string} req.params.openingId - Opening ID
 * @param {string} [req.body.note] - Optional note to founder
 *
 * @returns {Object} Created interest
 */
const expressInterest = asyncHandler(async (req, res) => {
  const builderId = req.user._id;
  const { openingId } = req.params;
  const { note } = req.body;

  const interest = await interestService.expressInterest(builderId, openingId, { note });

  return ApiResponse.created('Interest expressed successfully', { interest }).send(res);
});

/**
 * Withdraw interest from an opening
 *
 * @route POST /api/v1/interests/:id/withdraw
 * @access Private (Builder who expressed interest)
 *
 * @param {string} req.params.id - Interest ID
 *
 * @returns {Object} Updated interest
 */
const withdrawInterest = asyncHandler(async (req, res) => {
  const builderId = req.user._id;
  const { id } = req.params;

  const interest = await interestService.withdrawInterest(builderId, id);

  return ApiResponse.ok('Interest withdrawn successfully', { interest }).send(res);
});

/**
 * Get builder's interests
 *
 * @route GET /api/v1/interests/my
 * @access Private (Builders only)
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated interests
 */
const getBuilderInterests = asyncHandler(async (req, res) => {
  const builderId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await interestService.getBuilderInterests(builderId, {
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.interests,
    result.pagination,
    'Interests retrieved successfully'
  ).send(res);
});

/**
 * Get today's interest usage for builder
 *
 * @route GET /api/v1/interests/my/today
 * @access Private (Builders only)
 *
 * @returns {Object} Today's count, limit, and remaining
 */
const getTodayInterestCount = asyncHandler(async (req, res) => {
  const builderId = req.user._id;

  const stats = await interestService.getTodayInterestCount(builderId);

  return ApiResponse.ok('Today\'s interest count retrieved', stats).send(res);
});

/**
 * Check if builder has already expressed interest in an opening
 *
 * @route GET /api/v1/interests/check/:openingId
 * @access Private (Builders only)
 *
 * @param {string} req.params.openingId - Opening ID
 *
 * @returns {Object} Interest status
 */
const checkInterestByOpening = asyncHandler(async (req, res) => {
  const builderId = req.user._id;
  const { openingId } = req.params;

  const result = await interestService.checkInterestByOpening(builderId, openingId);

  return ApiResponse.ok('Interest check completed', result).send(res);
});

// ============================================
// FOUNDER ACTIONS
// ============================================

/**
 * Shortlist a builder (creates mutual match)
 *
 * @route POST /api/v1/interests/:id/shortlist
 * @access Private (Founders only)
 *
 * @param {string} req.params.id - Interest ID
 *
 * @returns {Object} Updated interest with match status
 */
const shortlistBuilder = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { id } = req.params;

  const interest = await interestService.shortlistBuilder(founderId, id);

  return ApiResponse.ok('Builder shortlisted - mutual match created!', { interest }).send(res);
});

/**
 * Pass on a builder
 *
 * @route POST /api/v1/interests/:id/pass
 * @access Private (Founders only)
 *
 * @param {string} req.params.id - Interest ID
 *
 * @returns {Object} Updated interest
 */
const passOnBuilder = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { id } = req.params;

  const interest = await interestService.passOnBuilder(founderId, id);

  return ApiResponse.ok('Passed on builder', { interest }).send(res);
});

/**
 * Get interests for founder's openings
 *
 * @route GET /api/v1/interests/received
 * @access Private (Founders only)
 *
 * @param {string} [req.query.openingId] - Filter by specific opening
 * @param {string} [req.query.status] - Filter by status
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated interests
 */
const getFounderInterests = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { openingId, status, page = 1, limit = 20 } = req.query;

  const result = await interestService.getFounderInterests(founderId, {
    openingId,
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.interests,
    result.pagination,
    'Interests retrieved successfully'
  ).send(res);
});

/**
 * Get pending interests count for founder
 *
 * @route GET /api/v1/interests/received/pending/count
 * @access Private (Founders only)
 *
 * @returns {Object} Pending interests count
 */
const getPendingInterestsCount = asyncHandler(async (req, res) => {
  const founderId = req.user._id;

  const count = await interestService.getPendingInterestsCount(founderId);

  return ApiResponse.ok('Pending interests count retrieved', { count }).send(res);
});

// ============================================
// MUTUAL MATCHES
// ============================================

/**
 * Get mutual matches for current user
 *
 * @route GET /api/v1/interests/matches
 * @access Private
 *
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated matches
 */
const getMutualMatches = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const result = await interestService.getMutualMatches(userId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.matches,
    result.pagination,
    'Mutual matches retrieved successfully'
  ).send(res);
});

/**
 * Get match by ID
 *
 * @route GET /api/v1/interests/matches/:id
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Interest/Match ID
 *
 * @returns {Object} Match details
 */
const getMatchById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const match = await interestService.getMatchById(id, userId);

  return ApiResponse.ok('Match retrieved successfully', { match }).send(res);
});

/**
 * Check if mutual match exists with another user
 *
 * @route GET /api/v1/interests/matches/check/:userId
 * @access Private
 *
 * @param {string} req.params.userId - Other user's ID
 *
 * @returns {Object} Match status
 */
const checkMutualMatch = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId } = req.params;
  const userType = req.user.userType;

  let match;
  if (userType === 'founder') {
    match = await interestService.checkMutualMatch(currentUserId, userId);
  } else {
    match = await interestService.checkMutualMatch(userId, currentUserId);
  }

  return ApiResponse.ok('Match check completed', {
    hasMatch: !!match,
    match: match || null,
  }).send(res);
});

// ============================================
// ANALYTICS
// ============================================

/**
 * Get interest statistics for current user
 *
 * @route GET /api/v1/interests/stats
 * @access Private
 *
 * @returns {Object} Interest statistics
 */
const getInterestStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await interestService.getInterestStats(userId);

  return ApiResponse.ok('Interest statistics retrieved', stats).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Builder actions
  expressInterest,
  withdrawInterest,
  getBuilderInterests,
  getTodayInterestCount,
  checkInterestByOpening,

  // Founder actions
  shortlistBuilder,
  passOnBuilder,
  getFounderInterests,
  getPendingInterestsCount,

  // Mutual matches
  getMutualMatches,
  getMatchById,
  checkMutualMatch,

  // Analytics
  getInterestStats,
};
