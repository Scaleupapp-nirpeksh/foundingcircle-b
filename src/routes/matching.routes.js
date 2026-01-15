/**
 * @fileoverview Matching Routes
 *
 * Defines all matching-related API endpoints.
 *
 * @module routes/matching
 */

const express = require('express');
const router = express.Router();

const matchingController = require('../controllers/matching.controller');
const {
  auth,
  requireFounder,
  requireBuilder,
  requireAdmin,
  requireCompleteProfile,
} = require('../middleware/auth');

// ============================================
// ALGORITHM INFO (Must be before parameterized routes)
// ============================================

/**
 * @route   GET /api/v1/matches/algorithm-info
 * @desc    Get matching algorithm weights and thresholds
 * @access  Private
 */
router.get('/algorithm-info', auth, matchingController.getAlgorithmInfo);

// ============================================
// DAILY MATCHES
// ============================================

/**
 * @route   GET /api/v1/matches/daily/founder
 * @desc    Get daily matches for current founder
 * @access  Private (Founders only)
 * @query   { limit?: number }
 */
router.get(
  '/daily/founder',
  auth,
  requireFounder,
  matchingController.getDailyMatchesForFounder
);

/**
 * @route   GET /api/v1/matches/daily/builder
 * @desc    Get daily matches for current builder
 * @access  Private (Builders only, requires complete profile)
 * @query   { limit?: number }
 */
router.get(
  '/daily/builder',
  auth,
  requireBuilder,
  requireCompleteProfile,
  matchingController.getDailyMatchesForBuilder
);

// ============================================
// MUTUAL MATCHES
// ============================================

/**
 * @route   GET /api/v1/matches/mutual
 * @desc    Get mutual matches for current user
 * @access  Private
 */
router.get('/mutual', auth, matchingController.getMutualMatches);

// ============================================
// COMPATIBILITY
// ============================================

/**
 * @route   GET /api/v1/matches/compatibility
 * @desc    Calculate compatibility between opening and builder
 * @access  Private
 * @query   { openingId: string, builderId: string }
 */
router.get('/compatibility', auth, matchingController.calculateCompatibility);

// ============================================
// MATCH GENERATION
// ============================================

/**
 * @route   POST /api/v1/matches/generate/opening/:openingId
 * @desc    Generate matches for a specific opening
 * @access  Private (Founders only)
 * @query   { limit?: number, minScore?: number }
 */
router.post(
  '/generate/opening/:openingId',
  auth,
  requireFounder,
  matchingController.generateMatchesForOpening
);

/**
 * @route   POST /api/v1/matches/generate/builder
 * @desc    Generate matches for current builder
 * @access  Private (Builders only, requires complete profile)
 * @query   { limit?: number, minScore?: number }
 */
router.post(
  '/generate/builder',
  auth,
  requireBuilder,
  requireCompleteProfile,
  matchingController.generateMatchesForBuilder
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   POST /api/v1/matches/admin/run-nightly
 * @desc    Trigger nightly match generation job
 * @access  Private (Admin only)
 */
router.post(
  '/admin/run-nightly',
  auth,
  requireAdmin,
  matchingController.runNightlyMatchGeneration
);

// ============================================
// MATCH ACTIONS (Must be after named routes)
// ============================================

/**
 * @route   POST /api/v1/matches/:id/action
 * @desc    Record a match action (like, skip, save)
 * @access  Private (Match participants only)
 * @body    { action: 'LIKE' | 'SKIP' | 'SAVE' }
 */
router.post('/:id/action', auth, matchingController.recordMatchAction);

/**
 * @route   POST /api/v1/matches/:id/like
 * @desc    Like a match
 * @access  Private (Match participants only)
 */
router.post('/:id/like', auth, matchingController.likeMatch);

/**
 * @route   POST /api/v1/matches/:id/skip
 * @desc    Skip a match
 * @access  Private (Match participants only)
 */
router.post('/:id/skip', auth, matchingController.skipMatch);

/**
 * @route   POST /api/v1/matches/:id/save
 * @desc    Save a match for later
 * @access  Private (Match participants only)
 */
router.post('/:id/save', auth, matchingController.saveMatch);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
