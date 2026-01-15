/**
 * @fileoverview Profile Service
 * 
 * Handles Founder and Builder profile management:
 * - Profile creation and updates
 * - Dual profile support (Founder + Builder)
 * - Role switching
 * - Onboarding flow
 * - Scenario responses
 * - Profile completion tracking
 * 
 * @module services/profile
 */

const { User, FounderProfile, BuilderProfile, ScenarioResponse } = require('../models');
const { ApiError } = require('../utils');
const { USER_TYPES } = require('../constants');
const logger = require('../utils/logger');

// ============================================
// FOUNDER PROFILE
// ============================================

/**
 * Create founder profile for a user
 * Supports dual profile - user can have both Founder and Builder profiles
 * 
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created profile
 * @throws {ApiError} If user not found or profile already exists
 */
const createFounderProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (user.founderProfile) {
    throw ApiError.conflict('Founder profile already exists');
  }
  
  const profile = await FounderProfile.create({
    user: userId,
    ...profileData,
  });
  
  // Update user
  user.founderProfile = profile._id;
  
  // Set active role if not set
  if (!user.activeRole) {
    user.activeRole = 'FOUNDER';
  }
  
  // Set userType if this is their first profile
  if (!user.builderProfile) {
    user.userType = USER_TYPES.FOUNDER;
  }
  
  // Check if onboarding should be marked complete
  if (profile.isComplete && !user.onboardingComplete) {
    user.onboardingComplete = true;
    user.onboardingCompletedAt = new Date();
  }
  
  await user.save();
  
  logger.info('Founder profile created', { userId, profileId: profile._id });
  
  return profile;
};

/**
 * Update existing founder profile
 * 
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 * @throws {ApiError} If user or profile not found
 */
const updateFounderProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  const profile = await FounderProfile.findOne({ user: userId });
  
  if (!profile) {
    throw ApiError.notFound('Founder profile not found');
  }
  
  // Update profile fields
  Object.assign(profile, profileData);
  await profile.save();
  
  // Check if onboarding should be marked complete
  if (profile.isComplete && !user.onboardingComplete) {
    user.onboardingComplete = true;
    user.onboardingCompletedAt = new Date();
    await user.save();
  }
  
  logger.info('Founder profile updated', { userId });
  
  return profile;
};

/**
 * Create or update founder profile (upsert)
 * 
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created/updated profile
 */
const upsertFounderProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  // Check if profile exists
  let profile = await FounderProfile.findOne({ user: userId });
  
  if (profile) {
    // Update existing profile
    Object.assign(profile, profileData);
    await profile.save();
    logger.info('Founder profile updated', { userId });
  } else {
    // Create new profile
    profile = await FounderProfile.create({
      user: userId,
      ...profileData,
    });
    
    // Update user
    user.founderProfile = profile._id;
    
    // Set active role if not set
    if (!user.activeRole) {
      user.activeRole = 'FOUNDER';
    }
    
    // Set userType if this is their first profile
    if (!user.builderProfile) {
      user.userType = USER_TYPES.FOUNDER;
    }
    
    logger.info('Founder profile created', { userId });
  }
  
  // Check if onboarding should be marked complete
  if (profile.isComplete && !user.onboardingComplete) {
    user.onboardingComplete = true;
    user.onboardingCompletedAt = new Date();
    logger.info('Founder onboarding completed', { userId });
  }
  
  await user.save();
  
  return profile;
};

/**
 * Get founder profile by user ID
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Founder profile
 * @throws {ApiError} If profile not found
 */
const getFounderProfile = async (userId) => {
  const profile = await FounderProfile.findOne({ user: userId })
    .populate('user', 'email name avatarUrl');
  
  if (!profile) {
    throw ApiError.notFound('Founder profile not found');
  }
  
  return profile;
};

/**
 * Get founder profile by profile ID
 * 
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Founder profile
 * @throws {ApiError} If profile not found
 */
const getFounderProfileById = async (profileId) => {
  const profile = await FounderProfile.findById(profileId)
    .populate('user', 'email name avatarUrl');
  
  if (!profile) {
    throw ApiError.notFound('Founder profile not found');
  }
  
  return profile;
};

/**
 * Get founder profile completion status
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Completion details
 */
const getFounderProfileCompletion = async (userId) => {
  const profile = await FounderProfile.findOne({ user: userId });
  
  if (!profile) {
    return {
      percentage: 0,
      isComplete: false,
      missing: ['Profile not created'],
    };
  }
  
  const missing = [];
  
  // Check required fields
  if (!profile.startupStage) missing.push('Startup Stage');
  if (!profile.hoursPerWeek) missing.push('Weekly Commitment');
  if (!profile.rolesSeeking?.length) missing.push('Roles Seeking');
  if (profile.equityRange?.min === undefined) missing.push('Equity Range');
  if (profile.cashRange?.min === undefined) missing.push('Cash Range');
  if (!profile.vestingType) missing.push('Vesting Type');
  if (!profile.intentStatement || profile.intentStatement.length < 50) missing.push('Intent Statement');
  if (!profile.remotePreference) missing.push('Remote Preference');
  if (!profile.allRisksAcknowledged) missing.push('Risk Acknowledgment');
  
  return {
    percentage: profile.completionPercentage,
    isComplete: profile.isComplete,
    missing,
  };
};

// ============================================
// BUILDER PROFILE
// ============================================

/**
 * Create builder profile for a user
 * Supports dual profile - user can have both Founder and Builder profiles
 * 
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created profile
 * @throws {ApiError} If user not found or profile already exists
 */
const createBuilderProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (user.builderProfile) {
    throw ApiError.conflict('Builder profile already exists');
  }
  
  const profile = await BuilderProfile.create({
    user: userId,
    ...profileData,
  });
  
  // Update user
  user.builderProfile = profile._id;
  
  // Set active role if not set
  if (!user.activeRole) {
    user.activeRole = 'BUILDER';
  }
  
  // Set userType if this is their first profile
  if (!user.founderProfile) {
    user.userType = USER_TYPES.BUILDER;
  }
  
  // Check if onboarding should be marked complete
  if (profile.isComplete && !user.onboardingComplete) {
    user.onboardingComplete = true;
    user.onboardingCompletedAt = new Date();
  }
  
  await user.save();
  
  logger.info('Builder profile created', { userId, profileId: profile._id });
  
  return profile;
};

/**
 * Update existing builder profile
 * 
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 * @throws {ApiError} If user or profile not found
 */
const updateBuilderProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  const profile = await BuilderProfile.findOne({ user: userId });
  
  if (!profile) {
    throw ApiError.notFound('Builder profile not found');
  }
  
  // Update profile fields
  Object.assign(profile, profileData);
  await profile.save();
  
  // Check if onboarding should be marked complete
  if (profile.isComplete && !user.onboardingComplete) {
    user.onboardingComplete = true;
    user.onboardingCompletedAt = new Date();
    await user.save();
  }
  
  logger.info('Builder profile updated', { userId });
  
  return profile;
};

/**
 * Create or update builder profile (upsert)
 * 
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created/updated profile
 */
const upsertBuilderProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  // Check if profile exists
  let profile = await BuilderProfile.findOne({ user: userId });
  
  if (profile) {
    // Update existing profile
    Object.assign(profile, profileData);
    await profile.save();
    logger.info('Builder profile updated', { userId });
  } else {
    // Create new profile
    profile = await BuilderProfile.create({
      user: userId,
      ...profileData,
    });
    
    // Update user
    user.builderProfile = profile._id;
    
    // Set active role if not set
    if (!user.activeRole) {
      user.activeRole = 'BUILDER';
    }
    
    // Set userType if this is their first profile
    if (!user.founderProfile) {
      user.userType = USER_TYPES.BUILDER;
    }
    
    logger.info('Builder profile created', { userId });
  }
  
  // Check if onboarding should be marked complete
  if (profile.isComplete && !user.onboardingComplete) {
    user.onboardingComplete = true;
    user.onboardingCompletedAt = new Date();
    logger.info('Builder onboarding completed', { userId });
  }
  
  await user.save();
  
  return profile;
};

/**
 * Get builder profile by user ID
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Builder profile
 * @throws {ApiError} If profile not found
 */
const getBuilderProfile = async (userId) => {
  const profile = await BuilderProfile.findOne({ user: userId })
    .populate('user', 'email name avatarUrl');
  
  if (!profile) {
    throw ApiError.notFound('Builder profile not found');
  }
  
  return profile;
};

/**
 * Get builder profile by profile ID
 * 
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Builder profile
 * @throws {ApiError} If profile not found
 */
const getBuilderProfileById = async (profileId) => {
  const profile = await BuilderProfile.findById(profileId)
    .populate('user', 'email name avatarUrl');
  
  if (!profile) {
    throw ApiError.notFound('Builder profile not found');
  }
  
  return profile;
};

/**
 * Get builder profile completion status
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Completion details
 */
const getBuilderProfileCompletion = async (userId) => {
  const profile = await BuilderProfile.findOne({ user: userId });
  
  if (!profile) {
    return {
      percentage: 0,
      isComplete: false,
      missing: ['Profile not created'],
    };
  }
  
  const missing = [];
  
  // Check required fields
  if (!profile.skills?.length || profile.skills.length < 2) missing.push('Skills (min 2)');
  if (!profile.riskAppetite) missing.push('Risk Appetite');
  if (!profile.compensationOpenness?.length) missing.push('Compensation Openness');
  if (!profile.hoursPerWeek) missing.push('Weekly Availability');
  if (!profile.durationPreference) missing.push('Duration Preference');
  if (!profile.intentStatement || profile.intentStatement.length < 50) missing.push('Intent Statement');
  if (!profile.remotePreference) missing.push('Remote Preference');
  if (!profile.rolesInterested?.length) missing.push('Roles Interested');
  
  return {
    percentage: profile.completionPercentage,
    isComplete: profile.isComplete,
    missing,
  };
};

// ============================================
// DUAL PROFILE MANAGEMENT
// ============================================

/**
 * Add a secondary profile to an existing user (dual profile)
 * Allows Founders to also be Builders and vice versa
 * 
 * @param {string} userId - User ID
 * @param {string} profileType - 'FOUNDER' or 'BUILDER'
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created profile
 */
const addSecondaryProfile = async (userId, profileType, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (profileType === 'FOUNDER') {
    if (user.founderProfile) {
      throw ApiError.conflict('Founder profile already exists');
    }
    return createFounderProfile(userId, profileData);
  } else if (profileType === 'BUILDER') {
    if (user.builderProfile) {
      throw ApiError.conflict('Builder profile already exists');
    }
    return createBuilderProfile(userId, profileData);
  } else {
    throw ApiError.badRequest('Invalid profile type. Must be FOUNDER or BUILDER');
  }
};

/**
 * Switch user's active role
 * 
 * @param {string} userId - User ID
 * @param {string} role - 'FOUNDER' or 'BUILDER'
 * @returns {Promise<Object>} Updated user
 */
const switchActiveRole = async (userId, role) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (!['FOUNDER', 'BUILDER'].includes(role)) {
    throw ApiError.badRequest('Invalid role. Must be FOUNDER or BUILDER');
  }
  
  if (role === 'FOUNDER' && !user.founderProfile) {
    throw ApiError.badRequest('You need a founder profile to switch to founder mode. Create one first.');
  }
  
  if (role === 'BUILDER' && !user.builderProfile) {
    throw ApiError.badRequest('You need a builder profile to switch to builder mode. Create one first.');
  }
  
  user.activeRole = role;
  await user.save();
  
  logger.info('User switched role', { userId, newRole: role });
  
  return user;
};

/**
 * Get user's current active profile
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Active profile with type info
 */
const getActiveProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate('founderProfile')
    .populate('builderProfile');
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (user.activeRole === 'FOUNDER' && user.founderProfile) {
    return {
      type: 'FOUNDER',
      profile: user.founderProfile,
    };
  } else if (user.activeRole === 'BUILDER' && user.builderProfile) {
    return {
      type: 'BUILDER',
      profile: user.builderProfile,
    };
  }
  
  // Default to whichever exists
  if (user.founderProfile) {
    return {
      type: 'FOUNDER',
      profile: user.founderProfile,
    };
  }
  
  if (user.builderProfile) {
    return {
      type: 'BUILDER',
      profile: user.builderProfile,
    };
  }
  
  throw ApiError.badRequest('No profile exists for this user');
};

/**
 * Get both profiles for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Both profiles with metadata
 */
const getUserProfiles = async (userId) => {
  const user = await User.findById(userId)
    .populate('founderProfile')
    .populate('builderProfile');
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  return {
    userId: user._id,
    email: user.email,
    name: user.name,
    activeRole: user.activeRole,
    hasDualProfile: !!(user.founderProfile && user.builderProfile),
    canSwitchRoles: !!(user.founderProfile && user.builderProfile),
    founderProfile: user.founderProfile || null,
    builderProfile: user.builderProfile || null,
  };
};

/**
 * Check if user can create a specific profile type
 * 
 * @param {string} userId - User ID
 * @param {string} profileType - 'FOUNDER' or 'BUILDER'
 * @returns {Promise<Object>} Can create and reason
 */
const canCreateProfile = async (userId, profileType) => {
  const user = await User.findById(userId);
  
  if (!user) {
    return {
      canCreate: false,
      reason: 'User not found',
    };
  }
  
  if (profileType === 'FOUNDER') {
    if (user.founderProfile) {
      return {
        canCreate: false,
        reason: 'Founder profile already exists',
      };
    }
    return {
      canCreate: true,
      reason: null,
    };
  }
  
  if (profileType === 'BUILDER') {
    if (user.builderProfile) {
      return {
        canCreate: false,
        reason: 'Builder profile already exists',
      };
    }
    return {
      canCreate: true,
      reason: null,
    };
  }
  
  return {
    canCreate: false,
    reason: 'Invalid profile type',
  };
};

// ============================================
// GENERIC PROFILE FUNCTIONS
// ============================================

/**
 * Get profile by user ID (auto-detects type based on active role)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Profile with type info
 * @throws {ApiError} If user not found
 */
const getProfileByUserId = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  let profile = null;
  let completion = null;
  let profileType = null;
  
  // Try to get profile based on active role first, then fallback to userType
  const roleToCheck = user.activeRole || user.userType;
  
  if (roleToCheck === 'FOUNDER' || roleToCheck === USER_TYPES.FOUNDER) {
    profile = await FounderProfile.findOne({ user: userId });
    if (profile) {
      profileType = 'FOUNDER';
      completion = await getFounderProfileCompletion(userId);
    }
  }
  
  if (!profile && (roleToCheck === 'BUILDER' || roleToCheck === USER_TYPES.BUILDER)) {
    profile = await BuilderProfile.findOne({ user: userId });
    if (profile) {
      profileType = 'BUILDER';
      completion = await getBuilderProfileCompletion(userId);
    }
  }
  
  // If still no profile, try the other type
  if (!profile) {
    profile = await FounderProfile.findOne({ user: userId });
    if (profile) {
      profileType = 'FOUNDER';
      completion = await getFounderProfileCompletion(userId);
    } else {
      profile = await BuilderProfile.findOne({ user: userId });
      if (profile) {
        profileType = 'BUILDER';
        completion = await getBuilderProfileCompletion(userId);
      }
    }
  }
  
  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      activeRole: user.activeRole,
      onboardingComplete: user.onboardingComplete,
      hasDualProfile: !!(user.founderProfile && user.builderProfile),
    },
    profileType,
    profile: profile ? profile.toObject() : null,
    completion,
  };
};

/**
 * Update profile based on user type or specified type
 * 
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @param {string} [profileType] - Optional: 'FOUNDER' or 'BUILDER'
 * @returns {Promise<Object>} Updated profile
 */
const updateProfile = async (userId, profileData, profileType = null) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  // Determine which profile to update
  const typeToUpdate = profileType || user.activeRole || user.userType;
  
  if (typeToUpdate === 'FOUNDER' || typeToUpdate === USER_TYPES.FOUNDER) {
    return upsertFounderProfile(userId, profileData);
  } else if (typeToUpdate === 'BUILDER' || typeToUpdate === USER_TYPES.BUILDER) {
    return upsertBuilderProfile(userId, profileData);
  }
  
  throw ApiError.badRequest('Invalid user type');
};

// ============================================
// SCENARIO RESPONSES
// ============================================

/**
 * Save scenario responses for a user
 * 
 * @param {string} userId - User ID
 * @param {Object} responses - Scenario responses
 * @param {string} responses.scenario1 - Response to scenario 1 (A/B/C/D)
 * @param {string} responses.scenario2 - Response to scenario 2
 * @param {string} responses.scenario3 - Response to scenario 3
 * @param {string} responses.scenario4 - Response to scenario 4
 * @param {string} responses.scenario5 - Response to scenario 5
 * @param {string} responses.scenario6 - Response to scenario 6
 * @returns {Promise<Object>} Saved scenario response
 */
const saveScenarioResponses = async (userId, responses) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  // Validate all 6 scenarios are present
  const requiredScenarios = ['scenario1', 'scenario2', 'scenario3', 'scenario4', 'scenario5', 'scenario6'];
  const validOptions = ['A', 'B', 'C', 'D'];
  
  for (const scenario of requiredScenarios) {
    if (!responses[scenario]) {
      throw ApiError.badRequest(`${scenario} response is required`);
    }
    if (!validOptions.includes(responses[scenario].toUpperCase())) {
      throw ApiError.badRequest(`${scenario} must be A, B, C, or D`);
    }
  }
  
  // Normalize responses to uppercase
  const normalizedResponses = {};
  for (const scenario of requiredScenarios) {
    normalizedResponses[scenario] = responses[scenario].toUpperCase();
  }
  
  // Upsert scenario response
  let scenarioResponse = await ScenarioResponse.findOne({ user: userId });
  
  if (scenarioResponse) {
    Object.assign(scenarioResponse, normalizedResponses);
    scenarioResponse.completedAt = new Date();
    await scenarioResponse.save();
  } else {
    scenarioResponse = await ScenarioResponse.create({
      user: userId,
      ...normalizedResponses,
      completedAt: new Date(),
    });
  }
  
  // Update user's scenario completion status
  user.scenarioComplete = true;
  await user.save();
  
  logger.info('Scenario responses saved', { userId });
  
  return scenarioResponse;
};

/**
 * Get scenario responses for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Scenario responses or null
 */
const getScenarioResponses = async (userId) => {
  return ScenarioResponse.findOne({ user: userId });
};

/**
 * Calculate scenario compatibility between two users
 * 
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<Object>} Compatibility score and breakdown
 */
const calculateScenarioCompatibility = async (userId1, userId2) => {
  const [responses1, responses2] = await Promise.all([
    ScenarioResponse.findOne({ user: userId1 }),
    ScenarioResponse.findOne({ user: userId2 }),
  ]);
  
  // If either user hasn't completed scenarios, return null
  if (!responses1 || !responses2) {
    return {
      score: null,
      breakdown: null,
      reason: 'One or both users have not completed scenario assessment',
    };
  }
  
  const scenarios = ['scenario1', 'scenario2', 'scenario3', 'scenario4', 'scenario5', 'scenario6'];
  let totalScore = 0;
  const breakdown = {};
  
  // Scoring per PRD:
  // Exact match: 10 points
  // Adjacent match: 5 points
  // Opposite match: 0 points
  const adjacentPairs = {
    'A': ['B'],
    'B': ['A', 'C'],
    'C': ['B', 'D'],
    'D': ['C'],
  };
  
  for (const scenario of scenarios) {
    const r1 = responses1[scenario];
    const r2 = responses2[scenario];
    
    let score = 0;
    let match = 'opposite';
    
    if (r1 === r2) {
      score = 10;
      match = 'exact';
    } else if (adjacentPairs[r1]?.includes(r2)) {
      score = 5;
      match = 'adjacent';
    }
    
    totalScore += score;
    breakdown[scenario] = { user1: r1, user2: r2, score, match };
  }
  
  // Normalize to 100%
  const normalizedScore = Math.round((totalScore / 60) * 100);
  
  return {
    score: normalizedScore,
    rawScore: totalScore,
    maxScore: 60,
    breakdown,
  };
};

// ============================================
// SEARCH & DISCOVERY
// ============================================

/**
 * Search builder profiles
 * 
 * @param {Object} filters - Search filters
 * @param {string[]} [filters.skills] - Required skills
 * @param {string} [filters.riskAppetite] - Risk appetite level
 * @param {string[]} [filters.compensationOpenness] - Compensation preferences
 * @param {number} [filters.minHours] - Minimum hours per week
 * @param {string} [filters.location] - Location
 * @param {string[]} [filters.rolesInterested] - Roles interested in
 * @param {Object} [options={}] - Pagination options
 * @returns {Promise<Object>} Paginated builder profiles
 */
const searchBuilderProfiles = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;
  
  const query = {
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
  };
  
  // Skills filter (any match)
  if (filters.skills && filters.skills.length > 0) {
    query.skills = { $in: filters.skills };
  }
  
  // Risk appetite filter
  if (filters.riskAppetite) {
    query.riskAppetite = filters.riskAppetite;
  }
  
  // Compensation openness filter
  if (filters.compensationOpenness && filters.compensationOpenness.length > 0) {
    query.compensationOpenness = { $in: filters.compensationOpenness };
  }
  
  // Minimum hours filter
  if (filters.minHours) {
    query.hoursPerWeek = { $gte: filters.minHours };
  }
  
  // Location filter (case-insensitive partial match)
  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }
  
  // Roles interested filter
  if (filters.rolesInterested && filters.rolesInterested.length > 0) {
    query.rolesInterested = { $in: filters.rolesInterested };
  }
  
  const skip = (page - 1) * limit;
  
  const [profiles, total] = await Promise.all([
    BuilderProfile.find(query)
      .populate('user', 'email name avatarUrl onboardingComplete')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    BuilderProfile.countDocuments(query),
  ]);
  
  return {
    profiles,
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
 * Search founder profiles
 * 
 * @param {Object} filters - Search filters
 * @param {string} [filters.startupStage] - Startup stage
 * @param {string[]} [filters.rolesSeeking] - Roles being offered
 * @param {number} [filters.minEquity] - Minimum equity offered
 * @param {number} [filters.minCash] - Minimum cash offered
 * @param {string} [filters.location] - Location
 * @param {Object} [options={}] - Pagination options
 * @returns {Promise<Object>} Paginated founder profiles
 */
const searchFounderProfiles = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;
  
  const query = {
    isComplete: true,
    isVisible: true,
  };
  
  // Startup stage filter
  if (filters.startupStage) {
    query.startupStage = filters.startupStage;
  }
  
  // Roles seeking filter
  if (filters.rolesSeeking && filters.rolesSeeking.length > 0) {
    query.rolesSeeking = { $in: filters.rolesSeeking };
  }
  
  // Minimum equity filter
  if (filters.minEquity !== undefined) {
    query['equityRange.max'] = { $gte: filters.minEquity };
  }
  
  // Minimum cash filter
  if (filters.minCash !== undefined) {
    query['cashRange.max'] = { $gte: filters.minCash };
  }
  
  // Location filter
  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }
  
  const skip = (page - 1) * limit;
  
  const [profiles, total] = await Promise.all([
    FounderProfile.find(query)
      .populate('user', 'email name avatarUrl onboardingComplete')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FounderProfile.countDocuments(query),
  ]);
  
  return {
    profiles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Founder profile
  createFounderProfile,
  updateFounderProfile,
  upsertFounderProfile,
  getFounderProfile,
  getFounderProfileById,
  getFounderProfileCompletion,
  
  // Builder profile
  createBuilderProfile,
  updateBuilderProfile,
  upsertBuilderProfile,
  getBuilderProfile,
  getBuilderProfileById,
  getBuilderProfileCompletion,
  
  // Dual profile management
  addSecondaryProfile,
  switchActiveRole,
  getActiveProfile,
  getUserProfiles,
  canCreateProfile,
  
  // Generic
  getProfileByUserId,
  updateProfile,
  
  // Scenarios
  saveScenarioResponses,
  getScenarioResponses,
  calculateScenarioCompatibility,
  
  // Search
  searchBuilderProfiles,
  searchFounderProfiles,
};