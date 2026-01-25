/**
 * @fileoverview Interest Routes
 *
 * Defines all interest/matching-related API endpoints.
 *
 * @module routes/interest
 */

const express = require('express');
const router = express.Router();

const interestController = require('../controllers/interest.controller');
const {
  auth,
  requireFounder,
  requireBuilder,
  requireCompleteProfile,
} = require('../../../shared/middleware/auth');

// ============================================
// BUILDER ROUTES
// ============================================

/**
 * @route   GET /api/v1/interests/my
 * @desc    Get builder's interests
 * @access  Private (Builders only)
 * @query   { status?, page?, limit? }
 */
router.get('/my', auth, requireBuilder, interestController.getBuilderInterests);

/**
 * @route   GET /api/v1/interests/my/today
 * @desc    Get today's interest usage for builder
 * @access  Private (Builders only)
 */
router.get('/my/today', auth, requireBuilder, interestController.getTodayInterestCount);

/**
 * @route   GET /api/v1/interests/check/:openingId
 * @desc    Check if builder has already expressed interest in an opening
 * @access  Private (Builders only)
 */
router.get('/check/:openingId', auth, requireBuilder, interestController.checkInterestByOpening);

/**
 * @route   POST /api/v1/interests/openings/:openingId
 * @desc    Express interest in an opening
 * @access  Private (Builders only, requires complete profile)
 * @body    { note?: string }
 */
router.post(
  '/openings/:openingId',
  auth,
  requireBuilder,
  requireCompleteProfile,
  interestController.expressInterest
);

/**
 * @route   POST /api/v1/interests/:id/withdraw
 * @desc    Withdraw interest from an opening
 * @access  Private (Builder who expressed interest)
 */
router.post('/:id/withdraw', auth, requireBuilder, interestController.withdrawInterest);

// ============================================
// FOUNDER ROUTES
// ============================================

/**
 * @route   GET /api/v1/interests/received
 * @desc    Get interests for founder's openings
 * @access  Private (Founders only)
 * @query   { openingId?, status?, page?, limit? }
 */
router.get('/received', auth, requireFounder, interestController.getFounderInterests);

/**
 * @route   GET /api/v1/interests/received/pending/count
 * @desc    Get pending interests count for founder
 * @access  Private (Founders only)
 */
router.get(
  '/received/pending/count',
  auth,
  requireFounder,
  interestController.getPendingInterestsCount
);

/**
 * @route   POST /api/v1/interests/:id/shortlist
 * @desc    Shortlist a builder (enables chat, but not a full match yet)
 * @access  Private (Founders only)
 */
router.post('/:id/shortlist', auth, requireFounder, interestController.shortlistBuilder);

/**
 * @route   POST /api/v1/interests/:id/propose-match
 * @desc    Propose a match to builder (after discussions)
 * @access  Private (Founders only)
 */
router.post('/:id/propose-match', auth, requireFounder, interestController.proposeMatch);

/**
 * @route   POST /api/v1/interests/:id/accept-match
 * @desc    Accept a match proposal from founder
 * @access  Private (Builders only)
 */
router.post('/:id/accept-match', auth, requireBuilder, interestController.acceptMatch);

/**
 * @route   POST /api/v1/interests/:id/decline-match
 * @desc    Decline a match proposal from founder
 * @access  Private (Builders only)
 */
router.post('/:id/decline-match', auth, requireBuilder, interestController.declineMatch);

/**
 * @route   POST /api/v1/interests/:id/pass
 * @desc    Pass on a builder
 * @access  Private (Founders only)
 */
router.post('/:id/pass', auth, requireFounder, interestController.passOnBuilder);

// ============================================
// MUTUAL MATCHES ROUTES
// ============================================

/**
 * @route   GET /api/v1/interests/matches
 * @desc    Get mutual matches for current user
 * @access  Private
 * @query   { page?, limit? }
 */
router.get('/matches', auth, interestController.getMutualMatches);

/**
 * @route   GET /api/v1/interests/matches/check/:userId
 * @desc    Check if mutual match exists with another user
 * @access  Private
 */
router.get('/matches/check/:userId', auth, interestController.checkMutualMatch);

/**
 * @route   GET /api/v1/interests/matches/:id
 * @desc    Get match by ID
 * @access  Private (Participants only)
 */
router.get('/matches/:id', auth, interestController.getMatchById);

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * @route   GET /api/v1/interests/stats
 * @desc    Get interest statistics for current user
 * @access  Private
 */
router.get('/stats', auth, interestController.getInterestStats);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
