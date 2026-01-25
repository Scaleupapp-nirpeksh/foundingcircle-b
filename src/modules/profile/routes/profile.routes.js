/**
 * @fileoverview Profile Routes
 *
 * Defines all profile-related API endpoints.
 *
 * @module routes/profile
 */

const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const uploadController = require('../../upload/controllers/upload.controller');
const { auth, requireCompleteProfile, requireFounder } = require('../../../shared/middleware/auth');
const { uploadPitchDeck, requireFile } = require('../../../shared/middleware/upload');

// ============================================
// CURRENT USER PROFILE ROUTES
// ============================================

/**
 * @route   GET /api/v1/profiles/me
 * @desc    Get current user's profile (auto-detects type)
 * @access  Private
 */
router.get('/me', auth, profileController.getMyProfile);

/**
 * @route   GET /api/v1/profiles/me/all
 * @desc    Get all profiles for current user (founder & builder)
 * @access  Private
 */
router.get('/me/all', auth, profileController.getMyProfiles);

/**
 * @route   GET /api/v1/profiles/me/active
 * @desc    Get current user's active profile
 * @access  Private
 */
router.get('/me/active', auth, profileController.getMyActiveProfile);

/**
 * @route   PATCH /api/v1/profiles/me
 * @desc    Update current user's profile (auto-detects type)
 * @access  Private
 * @query   { type?: 'founder' | 'builder' }
 */
router.patch('/me', auth, profileController.updateMyProfile);

/**
 * @route   GET /api/v1/profiles/me/can-create/:type
 * @desc    Check if user can create a specific profile type
 * @access  Private
 */
router.get('/me/can-create/:type', auth, profileController.canCreateProfile);

// ============================================
// FOUNDER PROFILE ROUTES
// ============================================

/**
 * @route   POST /api/v1/profiles/founder
 * @desc    Create founder profile for current user
 * @access  Private
 */
router.post('/founder', auth, profileController.createFounderProfile);

/**
 * @route   GET /api/v1/profiles/founder/me
 * @desc    Get current user's founder profile
 * @access  Private
 */
router.get('/founder/me', auth, profileController.getMyFounderProfile);

/**
 * @route   PATCH /api/v1/profiles/founder/me
 * @desc    Update current user's founder profile
 * @access  Private
 */
router.patch('/founder/me', auth, profileController.updateMyFounderProfile);

/**
 * @route   GET /api/v1/profiles/founder/me/completion
 * @desc    Get founder profile completion status
 * @access  Private
 */
router.get('/founder/me/completion', auth, profileController.getFounderProfileCompletion);

/**
 * @route   GET /api/v1/profiles/founder/discover
 * @desc    Discover/browse founder profiles with text search
 * @access  Private
 * @query   { search?, startupStage?, rolesSeeking[]?, industry[]?, minEquity?, maxEquity?, remotePreference?, location?, isVisible?, sort?, page?, limit? }
 */
router.get('/founder/discover', auth, profileController.discoverFounders);

/**
 * @route   GET /api/v1/profiles/founder/:id
 * @desc    Get founder profile by ID
 * @access  Private
 */
router.get('/founder/:id', auth, profileController.getFounderProfileById);

/**
 * @route   POST /api/v1/profiles/founder/me/pitch-deck
 * @desc    Upload pitch deck for founder profile
 * @access  Private (Founders only)
 * @body    multipart/form-data with 'pitchDeck' field
 */
router.post(
  '/founder/me/pitch-deck',
  auth,
  requireFounder,
  uploadPitchDeck,
  requireFile,
  uploadController.uploadPitchDeck
);

/**
 * @route   DELETE /api/v1/profiles/founder/me/pitch-deck
 * @desc    Delete pitch deck for founder profile
 * @access  Private (Founders only)
 */
router.delete('/founder/me/pitch-deck', auth, requireFounder, uploadController.deletePitchDeck);

// ============================================
// BUILDER PROFILE ROUTES
// ============================================

/**
 * @route   POST /api/v1/profiles/builder
 * @desc    Create builder profile for current user
 * @access  Private
 */
router.post('/builder', auth, profileController.createBuilderProfile);

/**
 * @route   GET /api/v1/profiles/builder/me
 * @desc    Get current user's builder profile
 * @access  Private
 */
router.get('/builder/me', auth, profileController.getMyBuilderProfile);

/**
 * @route   PATCH /api/v1/profiles/builder/me
 * @desc    Update current user's builder profile
 * @access  Private
 */
router.patch('/builder/me', auth, profileController.updateMyBuilderProfile);

/**
 * @route   GET /api/v1/profiles/builder/me/completion
 * @desc    Get builder profile completion status
 * @access  Private
 */
router.get('/builder/me/completion', auth, profileController.getBuilderProfileCompletion);

/**
 * @route   GET /api/v1/profiles/builder/discover
 * @desc    Discover/browse builder profiles with text search
 * @access  Private
 * @query   { search?, minHours?, maxHours?, skills[]?, riskAppetite?, rolesInterested[]?, remotePreference?, experienceLevel?, location?, isVisible?, isOpenToOpportunities?, sort?, page?, limit? }
 */
router.get('/builder/discover', auth, profileController.discoverBuilders);

/**
 * @route   GET /api/v1/profiles/builder/:id
 * @desc    Get builder profile by ID
 * @access  Private
 */
router.get('/builder/:id', auth, profileController.getBuilderProfileById);

// ============================================
// DUAL PROFILE & ROLE SWITCHING ROUTES
// ============================================

/**
 * @route   POST /api/v1/profiles/secondary/:type
 * @desc    Add a secondary profile (dual profile support)
 * @access  Private
 */
router.post('/secondary/:type', auth, profileController.addSecondaryProfile);

/**
 * @route   POST /api/v1/profiles/switch-role
 * @desc    Switch active role between founder and builder
 * @access  Private
 * @body    { role: 'founder' | 'builder' }
 */
router.post('/switch-role', auth, profileController.switchRole);

// ============================================
// SCENARIO ROUTES
// ============================================

/**
 * @route   POST /api/v1/profiles/scenarios
 * @desc    Save scenario responses
 * @access  Private
 * @body    { scenario1: 'A'|'B'|'C'|'D', scenario2: ..., ... scenario6: ... }
 */
router.post('/scenarios', auth, profileController.saveScenarios);

/**
 * @route   GET /api/v1/profiles/scenarios/me
 * @desc    Get current user's scenario responses
 * @access  Private
 */
router.get('/scenarios/me', auth, profileController.getMyScenarios);

/**
 * @route   GET /api/v1/profiles/scenarios/compatibility/:userId
 * @desc    Calculate scenario compatibility with another user
 * @access  Private (requires complete profile)
 */
router.get(
  '/scenarios/compatibility/:userId',
  auth,
  requireCompleteProfile,
  profileController.getScenarioCompatibility
);

// ============================================
// SEARCH & DISCOVERY ROUTES
// ============================================

/**
 * @route   GET /api/v1/profiles/search/builders
 * @desc    Search builder profiles
 * @access  Private (requires complete profile)
 * @query   { skills[], riskAppetite, compensationOpenness[], minHours, location, rolesInterested[], page, limit }
 */
router.get(
  '/search/builders',
  auth,
  requireCompleteProfile,
  profileController.searchBuilders
);

/**
 * @route   GET /api/v1/profiles/search/founders
 * @desc    Search founder profiles
 * @access  Private (requires complete profile)
 * @query   { startupStage, rolesSeeking[], minEquity, minCash, location, page, limit }
 */
router.get(
  '/search/founders',
  auth,
  requireCompleteProfile,
  profileController.searchFounders
);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
