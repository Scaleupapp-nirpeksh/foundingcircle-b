/**
 * @fileoverview Opening Routes
 *
 * Defines all opening-related API endpoints.
 *
 * @module routes/opening
 */

const express = require('express');
const router = express.Router();

const openingController = require('../controllers/opening.controller');
const {
  auth,
  optionalAuth,
  requireFounder,
  requireBuilder,
  requireAdmin,
  requireCompleteProfile,
} = require('../../../shared/middleware/auth');

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/v1/openings/featured
 * @desc    Get featured/recent openings
 * @access  Public
 * @query   { limit?: number }
 */
router.get('/featured', optionalAuth, openingController.getFeaturedOpenings);

// ============================================
// FOUNDER-SPECIFIC ROUTES (Must be before /:id)
// ============================================

/**
 * @route   GET /api/v1/openings/my
 * @desc    Get current founder's openings
 * @access  Private (Founders only)
 * @query   { status?, page?, limit? }
 */
router.get('/my', auth, requireFounder, openingController.getMyOpenings);

/**
 * @route   GET /api/v1/openings/my/stats
 * @desc    Get current founder's opening statistics
 * @access  Private (Founders only)
 */
router.get('/my/stats', auth, requireFounder, openingController.getMyOpeningStats);

// ============================================
// BUILDER-SPECIFIC ROUTES
// ============================================

/**
 * @route   GET /api/v1/openings/recommended
 * @desc    Get openings matching builder's profile
 * @access  Private (Builders only, requires complete profile)
 * @query   { page?, limit? }
 */
router.get(
  '/recommended',
  auth,
  requireBuilder,
  requireCompleteProfile,
  openingController.getRecommendedOpenings
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/v1/openings/stats
 * @desc    Get platform-wide opening statistics
 * @access  Private (Admin only)
 */
router.get('/stats', auth, requireAdmin, openingController.getOpeningStatistics);

// ============================================
// ROLE TYPE ROUTE
// ============================================

/**
 * @route   GET /api/v1/openings/role/:roleType
 * @desc    Get openings by role type
 * @access  Private
 * @query   { page?, limit? }
 */
router.get('/role/:roleType', auth, openingController.getOpeningsByRoleType);

// ============================================
// SEARCH & DISCOVERY
// ============================================

/**
 * @route   GET /api/v1/openings
 * @desc    Search openings with filters
 * @access  Private (requires complete profile)
 * @query   { roleType?, skills[], startupStage?, minEquity?, remotePreference?, location?, search?, page?, limit?, sort? }
 */
router.get('/', auth, requireCompleteProfile, openingController.searchOpenings);

/**
 * @route   POST /api/v1/openings
 * @desc    Create a new opening
 * @access  Private (Founders only)
 * @body    { title, roleType, description?, skillsRequired[], equityRange?, cashRange?, hoursPerWeek?, remotePreference? }
 */
router.post('/', auth, requireFounder, openingController.createOpening);

// ============================================
// OPENING BY ID ROUTES
// ============================================

/**
 * @route   GET /api/v1/openings/:id
 * @desc    Get opening by ID
 * @access  Private
 * @query   { includeFounder?: boolean }
 */
router.get('/:id', auth, openingController.getOpeningById);

/**
 * @route   PATCH /api/v1/openings/:id
 * @desc    Update an opening
 * @access  Private (Owner only)
 * @body    Opening fields to update
 */
router.patch('/:id', auth, requireFounder, openingController.updateOpening);

/**
 * @route   DELETE /api/v1/openings/:id
 * @desc    Delete an opening (soft delete)
 * @access  Private (Owner only)
 */
router.delete('/:id', auth, requireFounder, openingController.deleteOpening);

// ============================================
// OPENING STATUS MANAGEMENT
// ============================================

/**
 * @route   POST /api/v1/openings/:id/pause
 * @desc    Pause an opening
 * @access  Private (Owner only)
 */
router.post('/:id/pause', auth, requireFounder, openingController.pauseOpening);

/**
 * @route   POST /api/v1/openings/:id/resume
 * @desc    Resume a paused opening
 * @access  Private (Owner only)
 */
router.post('/:id/resume', auth, requireFounder, openingController.resumeOpening);

/**
 * @route   POST /api/v1/openings/:id/fill
 * @desc    Mark an opening as filled
 * @access  Private (Owner only)
 * @body    { filledBy?: string }
 */
router.post('/:id/fill', auth, requireFounder, openingController.markOpeningFilled);

// ============================================
// INTEREST/ENGAGEMENT
// ============================================

/**
 * @route   POST /api/v1/openings/:id/interest
 * @desc    Express interest in an opening
 * @access  Private
 */
router.post('/:id/interest', auth, openingController.expressInterest);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
