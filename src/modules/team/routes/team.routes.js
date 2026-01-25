/**
 * @fileoverview Team Management Routes
 *
 * Defines all team management API endpoints.
 *
 * @module routes/team
 */

const express = require('express');
const router = express.Router();

const teamController = require('../controllers/team.controller');
const { auth, requireFounder } = require('../../../shared/middleware/auth');

// ============================================
// GET ROUTES
// ============================================

/**
 * @route   GET /api/v1/team
 * @desc    Get team roster
 * @access  Private (Founders only)
 * @query   { status?, roleType?, department?, page?, limit? }
 */
router.get('/', auth, requireFounder, teamController.getTeam);

/**
 * @route   GET /api/v1/team/summary
 * @desc    Get team summary/stats
 * @access  Private (Founders only)
 */
router.get('/summary', auth, requireFounder, teamController.getTeamSummary);

/**
 * @route   GET /api/v1/team/check/:userId
 * @desc    Check if a user is on the team
 * @access  Private (Founders only)
 */
router.get('/check/:userId', auth, requireFounder, teamController.checkTeamMembership);

/**
 * @route   GET /api/v1/team/members/:memberId
 * @desc    Get team member by ID
 * @access  Private (Founders only)
 */
router.get('/members/:memberId', auth, requireFounder, teamController.getTeamMemberById);

// ============================================
// POST ROUTES
// ============================================

/**
 * @route   POST /api/v1/team/members
 * @desc    Add a team member
 * @access  Private (Founders only)
 * @body    { userId?, name?, email?, role, roleType?, department?, skills?, notes?, equityPercentage?, monthlyCompensation?, currency? }
 */
router.post('/members', auth, requireFounder, teamController.addTeamMember);

// ============================================
// PUT ROUTES
// ============================================

/**
 * @route   PUT /api/v1/team/members/:memberId
 * @desc    Update a team member
 * @access  Private (Founders only)
 * @body    { role?, roleType?, department?, skills?, notes?, equityPercentage?, monthlyCompensation?, currency? }
 */
router.put('/members/:memberId', auth, requireFounder, teamController.updateTeamMember);

// ============================================
// PATCH ROUTES
// ============================================

/**
 * @route   PATCH /api/v1/team/members/:memberId/status
 * @desc    Update team member status
 * @access  Private (Founders only)
 * @body    { status, trialEndDate? }
 */
router.patch('/members/:memberId/status', auth, requireFounder, teamController.updateMemberStatus);

// ============================================
// DELETE ROUTES
// ============================================

/**
 * @route   DELETE /api/v1/team/members/:memberId
 * @desc    Remove a team member (mark as inactive)
 * @access  Private (Founders only)
 */
router.delete('/members/:memberId', auth, requireFounder, teamController.removeTeamMember);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
