/**
 * @fileoverview Trial Routes
 *
 * Defines all trial collaboration-related API endpoints.
 *
 * @module routes/trial
 */

const express = require('express');
const router = express.Router();

const trialController = require('../controllers/trial.controller');
const { auth, requireAdmin } = require('../../../shared/middleware/auth');

// ============================================
// STATS & SPECIAL ROUTES (Must be before /:id)
// ============================================

/**
 * @route   GET /api/v1/trials/stats
 * @desc    Get trial statistics for current user
 * @access  Private
 */
router.get('/stats', auth, trialController.getTrialStats);

/**
 * @route   GET /api/v1/trials/active
 * @desc    Get active trials for current user
 * @access  Private
 */
router.get('/active', auth, trialController.getActiveTrials);

/**
 * @route   GET /api/v1/trials/conversation/:conversationId
 * @desc    Get trial for a specific conversation
 * @access  Private (Conversation participants only)
 */
router.get('/conversation/:conversationId', auth, trialController.getTrialForConversation);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/v1/trials/admin/ending-soon
 * @desc    Get trials ending soon (for notifications)
 * @access  Private (Admin only)
 * @query   { daysAhead?: number }
 */
router.get('/admin/ending-soon', auth, requireAdmin, trialController.getTrialsEndingSoon);

/**
 * @route   POST /api/v1/trials/admin/auto-complete
 * @desc    Trigger auto-completion of expired trials
 * @access  Private (Admin only)
 */
router.post('/admin/auto-complete', auth, requireAdmin, trialController.autoCompleteExpiredTrials);

// ============================================
// TRIAL PROPOSAL
// ============================================

/**
 * @route   POST /api/v1/trials/propose
 * @desc    Propose a trial in a conversation
 * @access  Private (Conversation participants only)
 * @body    { conversationId: string, durationDays: 7|14|21, goal: string, checkinFrequency?: string }
 */
router.post('/propose', auth, trialController.proposeTrial);

// ============================================
// TRIAL LIST
// ============================================

/**
 * @route   GET /api/v1/trials
 * @desc    Get all trials for current user
 * @access  Private
 * @query   { status?, page?, limit? }
 */
router.get('/', auth, trialController.getUserTrials);

// ============================================
// TRIAL BY ID ROUTES
// ============================================

/**
 * @route   GET /api/v1/trials/:id
 * @desc    Get trial by ID
 * @access  Private (Trial participants only)
 */
router.get('/:id', auth, trialController.getTrialById);

/**
 * @route   POST /api/v1/trials/:id/accept
 * @desc    Accept a trial proposal
 * @access  Private (Trial participants only)
 */
router.post('/:id/accept', auth, trialController.acceptTrial);

/**
 * @route   POST /api/v1/trials/:id/decline
 * @desc    Decline a trial proposal
 * @access  Private (Trial participants only)
 */
router.post('/:id/decline', auth, trialController.declineTrial);

/**
 * @route   POST /api/v1/trials/:id/cancel
 * @desc    Cancel an active or proposed trial
 * @access  Private (Trial participants only)
 * @body    { reason?: string }
 */
router.post('/:id/cancel', auth, trialController.cancelTrial);

/**
 * @route   POST /api/v1/trials/:id/complete
 * @desc    Complete a trial (manually trigger completion)
 * @access  Private (Trial participants only)
 */
router.post('/:id/complete', auth, trialController.completeTrial);

/**
 * @route   POST /api/v1/trials/:id/feedback
 * @desc    Submit feedback for a completed trial
 * @access  Private (Trial participants only)
 * @body    { communication: 1-5, reliability: 1-5, skillMatch: 1-5, wouldContinue: boolean, privateNotes?: string }
 */
router.post('/:id/feedback', auth, trialController.submitFeedback);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
