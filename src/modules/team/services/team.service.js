/**
 * @fileoverview Team Management Service
 *
 * Handles team roster operations for founders:
 * - Adding team members (manual and auto from matches)
 * - Updating team member status
 * - Getting team roster and stats
 *
 * @module services/team
 */

const { TeamMember, TEAM_MEMBER_STATUS, TEAM_MEMBER_SOURCE } = require('../models/TeamMember');
const { User, FounderProfile, BuilderProfile } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const { USER_TYPES } = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');

// ============================================
// ADD TEAM MEMBERS
// ============================================

/**
 * Add a team member manually
 *
 * @param {string} founderId - Founder's user ID
 * @param {Object} data - Team member data
 * @returns {Promise<Object>} Created team member
 */
const addTeamMember = async (founderId, data) => {
  // Verify founder exists
  const founder = await User.findById(founderId);
  if (!founder) {
    throw ApiError.notFound('Founder not found');
  }

  const founderProfile = await FounderProfile.findOne({ user: founderId });

  // If adding a platform user
  if (data.userId) {
    const user = await User.findById(data.userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if already on team
    const existing = await TeamMember.findOne({
      founder: founderId,
      user: data.userId,
    });

    if (existing && existing.status !== TEAM_MEMBER_STATUS.INACTIVE) {
      throw ApiError.conflict('This user is already on your team');
    }

    // Reactivate if inactive
    if (existing && existing.status === TEAM_MEMBER_STATUS.INACTIVE) {
      existing.status = TEAM_MEMBER_STATUS.ACTIVE;
      existing.leftAt = null;
      existing.role = data.role || existing.role;
      existing.roleType = data.roleType || existing.roleType;
      existing.department = data.department || existing.department;
      existing.notes = data.notes || existing.notes;
      await existing.save();
      return existing;
    }

    // Get builder profile if exists
    let builderProfile = null;
    if (user.activeRole === USER_TYPES.BUILDER || user.userType === USER_TYPES.BUILDER) {
      builderProfile = await BuilderProfile.findOne({ user: data.userId });
    }

    const teamMember = await TeamMember.create({
      founder: founderId,
      founderProfile: founderProfile?._id,
      user: data.userId,
      builderProfile: builderProfile?._id,
      role: data.role,
      roleType: data.roleType || 'EMPLOYEE',
      department: data.department || 'ENGINEERING',
      skills: builderProfile?.skills || data.skills || [],
      status: TEAM_MEMBER_STATUS.ACTIVE,
      source: TEAM_MEMBER_SOURCE.MANUAL,
      joinedAt: data.joinedAt || new Date(),
      equityPercentage: data.equityPercentage,
      monthlyCompensation: data.monthlyCompensation,
      currency: data.currency,
      notes: data.notes,
    });

    logger.info('Team member added from platform user', {
      founderId,
      userId: data.userId,
      teamMemberId: teamMember._id,
    });

    return teamMember;
  }

  // Adding a non-platform member (manual entry)
  if (!data.name) {
    throw ApiError.badRequest('Name is required for manual team member entry');
  }

  const teamMember = await TeamMember.create({
    founder: founderId,
    founderProfile: founderProfile?._id,
    name: data.name,
    email: data.email,
    profilePhoto: data.profilePhoto,
    role: data.role,
    roleType: data.roleType || 'EMPLOYEE',
    department: data.department || 'ENGINEERING',
    skills: data.skills || [],
    status: TEAM_MEMBER_STATUS.ACTIVE,
    source: TEAM_MEMBER_SOURCE.MANUAL,
    joinedAt: data.joinedAt || new Date(),
    equityPercentage: data.equityPercentage,
    monthlyCompensation: data.monthlyCompensation,
    currency: data.currency,
    notes: data.notes,
    linkedinUrl: data.linkedinUrl,
  });

  logger.info('Manual team member added', {
    founderId,
    teamMemberId: teamMember._id,
    name: data.name,
  });

  return teamMember;
};

/**
 * Auto-add team member from matched interest
 * Called when match is accepted
 *
 * @param {string} founderId - Founder's user ID
 * @param {Object} interest - Interest document
 * @returns {Promise<Object>} Created team member
 */
const addFromMatch = async (founderId, interest) => {
  try {
    const builderProfile = await BuilderProfile.findById(interest.builderProfile);
    const teamMember = await TeamMember.addFromMatch(founderId, interest, builderProfile);

    logger.info('Team member auto-added from match', {
      founderId,
      builderId: interest.builder,
      interestId: interest._id,
      teamMemberId: teamMember._id,
    });

    return teamMember;
  } catch (error) {
    logger.error('Failed to auto-add team member from match', {
      founderId,
      interestId: interest._id,
      error: error.message,
    });
    throw error;
  }
};

// ============================================
// UPDATE TEAM MEMBERS
// ============================================

/**
 * Update a team member
 *
 * @param {string} founderId - Founder's user ID
 * @param {string} memberId - Team member ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated team member
 */
const updateTeamMember = async (founderId, memberId, updates) => {
  const teamMember = await TeamMember.findById(memberId);

  if (!teamMember) {
    throw ApiError.notFound('Team member not found');
  }

  // Verify ownership
  if (teamMember.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only update your own team members');
  }

  // Apply allowed updates
  const allowedFields = [
    'role', 'roleType', 'department', 'skills',
    'equityPercentage', 'monthlyCompensation', 'currency',
    'notes', 'linkedinUrl', 'name', 'email', 'profilePhoto'
  ];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      teamMember[field] = updates[field];
    }
  });

  await teamMember.save();

  logger.info('Team member updated', {
    founderId,
    teamMemberId: memberId,
  });

  return teamMember;
};

/**
 * Update team member status
 *
 * @param {string} founderId - Founder's user ID
 * @param {string} memberId - Team member ID
 * @param {string} status - New status
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Updated team member
 */
const updateMemberStatus = async (founderId, memberId, status, options = {}) => {
  const teamMember = await TeamMember.findById(memberId);

  if (!teamMember) {
    throw ApiError.notFound('Team member not found');
  }

  // Verify ownership
  if (teamMember.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only update your own team members');
  }

  if (!Object.values(TEAM_MEMBER_STATUS).includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }

  teamMember.status = status;

  if (status === TEAM_MEMBER_STATUS.INACTIVE) {
    teamMember.leftAt = new Date();
  } else if (status === TEAM_MEMBER_STATUS.ACTIVE) {
    teamMember.leftAt = null;
  } else if (status === TEAM_MEMBER_STATUS.TRIAL && options.trialEndDate) {
    teamMember.trialEndDate = options.trialEndDate;
  }

  await teamMember.save();

  logger.info('Team member status updated', {
    founderId,
    teamMemberId: memberId,
    newStatus: status,
  });

  return teamMember;
};

/**
 * Remove a team member (mark as inactive)
 *
 * @param {string} founderId - Founder's user ID
 * @param {string} memberId - Team member ID
 * @returns {Promise<Object>} Updated team member
 */
const removeTeamMember = async (founderId, memberId) => {
  return updateMemberStatus(founderId, memberId, TEAM_MEMBER_STATUS.INACTIVE);
};

// ============================================
// GET TEAM DATA
// ============================================

/**
 * Get founder's team roster
 *
 * @param {string} founderId - Founder's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Team members with pagination
 */
const getTeam = async (founderId, options = {}) => {
  const { status, roleType, department, page = 1, limit = 50 } = options;

  const query = { founder: founderId };
  if (status) {
    query.status = status;
  } else {
    // By default, show active and trial members
    query.status = { $in: [TEAM_MEMBER_STATUS.ACTIVE, TEAM_MEMBER_STATUS.TRIAL, TEAM_MEMBER_STATUS.PENDING] };
  }
  if (roleType) {
    query.roleType = roleType;
  }
  if (department) {
    query.department = department;
  }

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    TeamMember.find(query)
      .populate('user', 'name profilePhoto email phone activeRole')
      .populate('builderProfile', 'headline skills location')
      .populate('opening', 'title roleType')
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TeamMember.countDocuments(query),
  ]);

  return {
    members,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

/**
 * Get team member by ID
 *
 * @param {string} founderId - Founder's user ID
 * @param {string} memberId - Team member ID
 * @returns {Promise<Object>} Team member
 */
const getTeamMemberById = async (founderId, memberId) => {
  const teamMember = await TeamMember.findById(memberId)
    .populate('user', 'name profilePhoto email phone activeRole')
    .populate('builderProfile', 'headline skills location experience education')
    .populate('opening', 'title roleType description')
    .populate('interest');

  if (!teamMember) {
    throw ApiError.notFound('Team member not found');
  }

  // Verify ownership
  if (teamMember.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only view your own team members');
  }

  return teamMember;
};

/**
 * Get team summary/stats
 *
 * @param {string} founderId - Founder's user ID
 * @returns {Promise<Object>} Team summary
 */
const getTeamSummary = async (founderId) => {
  const summary = await TeamMember.getTeamSummary(founderId);

  // Get recent additions
  const recentAdditions = await TeamMember.find({
    founder: founderId,
    status: { $in: [TEAM_MEMBER_STATUS.ACTIVE, TEAM_MEMBER_STATUS.TRIAL] },
  })
    .populate('user', 'name profilePhoto')
    .sort({ joinedAt: -1 })
    .limit(5)
    .lean();

  return {
    ...summary,
    recentAdditions,
  };
};

/**
 * Check if a user is on the founder's team
 *
 * @param {string} founderId - Founder's user ID
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} Result with isOnTeam flag
 */
const checkTeamMembership = async (founderId, userId) => {
  const isOnTeam = await TeamMember.isOnTeam(founderId, userId);

  let member = null;
  if (isOnTeam) {
    member = await TeamMember.findOne({
      founder: founderId,
      user: userId,
      status: { $in: [TEAM_MEMBER_STATUS.ACTIVE, TEAM_MEMBER_STATUS.PENDING, TEAM_MEMBER_STATUS.TRIAL] },
    });
  }

  return {
    isOnTeam,
    member,
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Add members
  addTeamMember,
  addFromMatch,

  // Update members
  updateTeamMember,
  updateMemberStatus,
  removeTeamMember,

  // Get team data
  getTeam,
  getTeamMemberById,
  getTeamSummary,
  checkTeamMembership,

  // Constants
  TEAM_MEMBER_STATUS,
  TEAM_MEMBER_SOURCE,
};
