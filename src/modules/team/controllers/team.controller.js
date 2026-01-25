/**
 * @fileoverview Team Management Controller
 *
 * Handles HTTP endpoints for team management:
 * - Adding team members
 * - Updating team members
 * - Getting team roster
 * - Team stats/summary
 *
 * @module controllers/team
 */

const teamService = require('../services/team.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// ADD TEAM MEMBERS
// ============================================

/**
 * Add a team member manually
 *
 * @route POST /api/v1/team/members
 * @access Private (Founders only)
 */
const addTeamMember = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const memberData = req.body;

  const teamMember = await teamService.addTeamMember(founderId, memberData);

  return ApiResponse.created('Team member added successfully', { member: teamMember }).send(res);
});

// ============================================
// UPDATE TEAM MEMBERS
// ============================================

/**
 * Update a team member
 *
 * @route PUT /api/v1/team/members/:memberId
 * @access Private (Founders only)
 */
const updateTeamMember = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { memberId } = req.params;
  const updates = req.body;

  const teamMember = await teamService.updateTeamMember(founderId, memberId, updates);

  return ApiResponse.ok('Team member updated successfully', { member: teamMember }).send(res);
});

/**
 * Update team member status
 *
 * @route PATCH /api/v1/team/members/:memberId/status
 * @access Private (Founders only)
 */
const updateMemberStatus = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { memberId } = req.params;
  const { status, trialEndDate } = req.body;

  const teamMember = await teamService.updateMemberStatus(founderId, memberId, status, { trialEndDate });

  return ApiResponse.ok('Team member status updated', { member: teamMember }).send(res);
});

/**
 * Remove a team member (mark as inactive)
 *
 * @route DELETE /api/v1/team/members/:memberId
 * @access Private (Founders only)
 */
const removeTeamMember = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { memberId } = req.params;

  const teamMember = await teamService.removeTeamMember(founderId, memberId);

  return ApiResponse.ok('Team member removed', { member: teamMember }).send(res);
});

// ============================================
// GET TEAM DATA
// ============================================

/**
 * Get team roster
 *
 * @route GET /api/v1/team
 * @access Private (Founders only)
 */
const getTeam = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { status, roleType, department, page = 1, limit = 50 } = req.query;

  const result = await teamService.getTeam(founderId, {
    status,
    roleType,
    department,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.members,
    result.pagination,
    'Team roster retrieved'
  ).send(res);
});

/**
 * Get team member by ID
 *
 * @route GET /api/v1/team/members/:memberId
 * @access Private (Founders only)
 */
const getTeamMemberById = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { memberId } = req.params;

  const teamMember = await teamService.getTeamMemberById(founderId, memberId);

  return ApiResponse.ok('Team member retrieved', { member: teamMember }).send(res);
});

/**
 * Get team summary/stats
 *
 * @route GET /api/v1/team/summary
 * @access Private (Founders only)
 */
const getTeamSummary = asyncHandler(async (req, res) => {
  const founderId = req.user._id;

  const summary = await teamService.getTeamSummary(founderId);

  return ApiResponse.ok('Team summary retrieved', { summary }).send(res);
});

/**
 * Check if a user is on the team
 *
 * @route GET /api/v1/team/check/:userId
 * @access Private (Founders only)
 */
const checkTeamMembership = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { userId } = req.params;

  const result = await teamService.checkTeamMembership(founderId, userId);

  return ApiResponse.ok('Team membership checked', result).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  addTeamMember,
  updateTeamMember,
  updateMemberStatus,
  removeTeamMember,
  getTeam,
  getTeamMemberById,
  getTeamSummary,
  checkTeamMembership,
};
