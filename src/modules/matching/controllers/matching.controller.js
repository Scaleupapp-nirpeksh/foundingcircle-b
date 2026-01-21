/**
 * @fileoverview Matching Controller
 *
 * Handles all matching-related HTTP endpoints:
 * - Daily match retrieval for founders/builders
 * - Match actions (like, skip, save)
 * - Compatibility calculations
 * - Match generation
 * - Mutual matches
 *
 * @module controllers/matching
 */

const matchingService = require('../services/matching.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// DAILY MATCHES
// ============================================

/**
 * Get daily matches for the current founder
 *
 * @route GET /api/v1/matches/daily/founder
 * @access Private (Founders only)
 *
 * @param {number} [req.query.limit=5] - Number of matches (5 for free, unlimited for Pro)
 *
 * @returns {Object} Daily matches
 */
const getDailyMatchesForFounder = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const limit = parseInt(req.query.limit, 10) || 5;

  const matches = await matchingService.getDailyMatchesForFounder(founderId, { limit });

  return ApiResponse.ok('Daily matches retrieved', { matches, count: matches.length }).send(res);
});

/**
 * Get daily matches for the current builder
 *
 * @route GET /api/v1/matches/daily/builder
 * @access Private (Builders only)
 *
 * @param {number} [req.query.limit=5] - Number of matches (5 for free, 15 for Boost)
 *
 * @returns {Object} Daily matches
 */
const getDailyMatchesForBuilder = asyncHandler(async (req, res) => {
  const builderId = req.user._id;
  const limit = parseInt(req.query.limit, 10) || 5;

  const matches = await matchingService.getDailyMatchesForBuilder(builderId, { limit });

  return ApiResponse.ok('Daily matches retrieved', { matches, count: matches.length }).send(res);
});

// ============================================
// MATCH ACTIONS
// ============================================

/**
 * Record a match action (like, skip, save)
 *
 * @route POST /api/v1/matches/:id/action
 * @access Private (Match participants only)
 *
 * @param {string} req.params.id - Match ID
 * @param {string} req.body.action - Action (LIKE, SKIP, SAVE)
 *
 * @returns {Object} Updated match with mutual status
 */
const recordMatchAction = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { action } = req.body;

  const result = await matchingService.recordMatchAction(id, userId, action);

  let message = 'Action recorded';
  if (result.newlyMutual) {
    message = 'It\'s a match! You both liked each other.';
  }

  return ApiResponse.ok(message, {
    match: result.match,
    isMutual: result.match.isMutual,
    newlyMutual: result.newlyMutual,
  }).send(res);
});

/**
 * Like a match
 *
 * @route POST /api/v1/matches/:id/like
 * @access Private (Match participants only)
 *
 * @param {string} req.params.id - Match ID
 *
 * @returns {Object} Updated match
 */
const likeMatch = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const result = await matchingService.recordMatchAction(id, userId, 'LIKE');

  let message = 'Match liked';
  if (result.newlyMutual) {
    message = 'It\'s a match! You both liked each other.';
  }

  return ApiResponse.ok(message, {
    match: result.match,
    isMutual: result.match.isMutual,
    newlyMutual: result.newlyMutual,
  }).send(res);
});

/**
 * Skip a match
 *
 * @route POST /api/v1/matches/:id/skip
 * @access Private (Match participants only)
 *
 * @param {string} req.params.id - Match ID
 *
 * @returns {Object} Updated match
 */
const skipMatch = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const result = await matchingService.recordMatchAction(id, userId, 'SKIP');

  return ApiResponse.ok('Match skipped', { match: result.match }).send(res);
});

/**
 * Save a match for later
 *
 * @route POST /api/v1/matches/:id/save
 * @access Private (Match participants only)
 *
 * @param {string} req.params.id - Match ID
 *
 * @returns {Object} Updated match
 */
const saveMatch = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const result = await matchingService.recordMatchAction(id, userId, 'SAVE');

  return ApiResponse.ok('Match saved for later', { match: result.match }).send(res);
});

// ============================================
// MUTUAL MATCHES
// ============================================

/**
 * Get mutual matches for current user
 *
 * @route GET /api/v1/matches/mutual
 * @access Private
 *
 * @returns {Object} Mutual matches
 */
const getMutualMatches = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const matches = await matchingService.getMutualMatches(userId);

  return ApiResponse.ok('Mutual matches retrieved', {
    matches,
    count: matches.length,
  }).send(res);
});

// ============================================
// MATCH GENERATION
// ============================================

/**
 * Generate matches for an opening
 *
 * @route POST /api/v1/matches/generate/opening/:openingId
 * @access Private (Founders only - opening owner)
 *
 * @param {string} req.params.openingId - Opening ID
 * @param {number} [req.query.limit=50] - Max matches to generate
 * @param {number} [req.query.minScore=60] - Minimum score to include
 *
 * @returns {Object} Generated matches
 */
const generateMatchesForOpening = asyncHandler(async (req, res) => {
  const { openingId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;
  const minScore = parseInt(req.query.minScore, 10) || 60;

  const matches = await matchingService.generateMatchesForOpening(openingId, {
    limit,
    minScore,
  });

  return ApiResponse.ok('Matches generated for opening', {
    matches,
    count: matches.length,
    openingId,
  }).send(res);
});

/**
 * Generate matches for the current builder
 *
 * @route POST /api/v1/matches/generate/builder
 * @access Private (Builders only)
 *
 * @param {number} [req.query.limit=50] - Max matches to generate
 * @param {number} [req.query.minScore=60] - Minimum score to include
 *
 * @returns {Object} Generated matches
 */
const generateMatchesForBuilder = asyncHandler(async (req, res) => {
  const builderId = req.user._id;
  const limit = parseInt(req.query.limit, 10) || 50;
  const minScore = parseInt(req.query.minScore, 10) || 60;

  const matches = await matchingService.generateMatchesForBuilder(builderId, {
    limit,
    minScore,
  });

  return ApiResponse.ok('Matches generated for builder', {
    matches,
    count: matches.length,
  }).send(res);
});

// ============================================
// COMPATIBILITY
// ============================================

/**
 * Calculate compatibility between an opening and a builder (preview)
 *
 * @route GET /api/v1/matches/compatibility
 * @access Private
 *
 * @param {string} req.query.openingId - Opening ID
 * @param {string} req.query.builderId - Builder user ID
 *
 * @returns {Object} Compatibility score and breakdown
 */
const calculateCompatibility = asyncHandler(async (req, res) => {
  const { openingId, builderId } = req.query;

  if (!openingId || !builderId) {
    return ApiResponse.badRequest('openingId and builderId are required').send(res);
  }

  // Import models to fetch the data
  const { Opening, BuilderProfile } = require('../../models');

  const opening = await Opening.findById(openingId)
    .populate('founder')
    .populate('founderProfile');

  if (!opening) {
    return ApiResponse.notFound('Opening not found').send(res);
  }

  const builderProfile = await BuilderProfile.findOne({ user: builderId })
    .populate('user');

  if (!builderProfile) {
    return ApiResponse.notFound('Builder profile not found').send(res);
  }

  const compatibility = await matchingService.calculateCompatibility(
    opening,
    opening.founderProfile,
    builderProfile,
    opening.founder._id,
    builderId
  );

  return ApiResponse.ok('Compatibility calculated', { compatibility }).send(res);
});

/**
 * Get matching algorithm weights and thresholds
 *
 * @route GET /api/v1/matches/algorithm-info
 * @access Private
 *
 * @returns {Object} Algorithm weights and thresholds
 */
const getAlgorithmInfo = asyncHandler(async (req, res) => {
  return ApiResponse.ok('Algorithm information retrieved', {
    weights: matchingService.WEIGHTS,
    thresholds: matchingService.SCORE_THRESHOLDS,
    factors: [
      { name: 'Compensation', weight: matchingService.WEIGHTS.COMPENSATION, description: 'Alignment between what founder offers and what builder accepts' },
      { name: 'Commitment', weight: matchingService.WEIGHTS.COMMITMENT, description: 'Hours per week overlap' },
      { name: 'Stage', weight: matchingService.WEIGHTS.STAGE, description: 'Builder risk appetite vs startup stage' },
      { name: 'Skills', weight: matchingService.WEIGHTS.SKILLS, description: 'Skill match percentage' },
      { name: 'Scenario', weight: matchingService.WEIGHTS.SCENARIO, description: 'Scenario response compatibility' },
      { name: 'Geography', weight: matchingService.WEIGHTS.GEOGRAPHY, description: 'Location and remote preference alignment' },
    ],
  }).send(res);
});

// ============================================
// ADMIN - NIGHTLY JOB
// ============================================

/**
 * Trigger nightly match generation job
 *
 * @route POST /api/v1/matches/admin/run-nightly
 * @access Private (Admin only)
 *
 * @returns {Object} Job result summary
 */
const runNightlyMatchGeneration = asyncHandler(async (req, res) => {
  const result = await matchingService.runNightlyMatchGeneration();

  return ApiResponse.ok('Nightly match generation completed', result).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Daily matches
  getDailyMatchesForFounder,
  getDailyMatchesForBuilder,

  // Match actions
  recordMatchAction,
  likeMatch,
  skipMatch,
  saveMatch,

  // Mutual matches
  getMutualMatches,

  // Match generation
  generateMatchesForOpening,
  generateMatchesForBuilder,

  // Compatibility
  calculateCompatibility,
  getAlgorithmInfo,

  // Admin
  runNightlyMatchGeneration,
};
