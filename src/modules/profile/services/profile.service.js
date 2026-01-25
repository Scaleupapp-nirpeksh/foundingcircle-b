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

const { User, FounderProfile, BuilderProfile, ScenarioResponse } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const { USER_TYPES } = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');

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
  
  // Mark onboarding as complete when profile is created
  // (user has completed the profile creation flow)
  if (!user.onboardingComplete) {
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
  
  // Mark onboarding as complete when profile is created
  // (user has completed the profile creation flow)
  if (!user.onboardingComplete) {
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
 * @param {string} [options.requesterId] - ID of user making the request (for compatibility calculation)
 * @returns {Promise<Object>} Paginated builder profiles with public fields only
 */
const searchBuilderProfiles = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt', requesterId } = options;

  const query = {
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
  };

  // Exclude the requester from results
  if (requesterId) {
    query.user = { $ne: requesterId };
  }

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

  // Select only public fields for search results
  const publicFields = [
    'user', 'displayName', 'headline', 'skills', 'riskAppetite',
    'compensationOpenness', 'hoursPerWeek', 'durationPreference',
    'intentStatement', 'location', 'remotePreference', 'rolesInterested',
    'experience', 'education', 'portfolioLinks', 'socialLinks',
    'isVerified', 'createdAt', 'lastActiveAt',
  ].join(' ');

  const [profiles, total] = await Promise.all([
    BuilderProfile.find(query)
      .select(publicFields)
      .populate('user', 'name profilePhoto avatarUrl activeRole')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    BuilderProfile.countDocuments(query),
  ]);

  // Calculate scenario compatibility if requester ID provided
  let profilesWithCompatibility = profiles;
  if (requesterId) {
    const requesterScenario = await ScenarioResponse.findOne({ user: requesterId });
    if (requesterScenario) {
      profilesWithCompatibility = await Promise.all(
        profiles.map(async (profile) => {
          const theirScenario = await ScenarioResponse.findOne({ user: profile.user._id });
          if (theirScenario) {
            const compatibility = await calculateScenarioCompatibility(requesterId, profile.user._id);
            return { ...profile, scenarioCompatibility: compatibility.score };
          }
          return { ...profile, scenarioCompatibility: null };
        })
      );
    }
  }

  return {
    profiles: profilesWithCompatibility,
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
 * @param {string} [options.requesterId] - ID of user making the request (for compatibility calculation)
 * @returns {Promise<Object>} Paginated founder profiles with public fields only
 */
const searchFounderProfiles = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt', requesterId } = options;

  const query = {
    isComplete: true,
    isVisible: true,
  };

  // Exclude the requester from results
  if (requesterId) {
    query.user = { $ne: requesterId };
  }

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

  // Select only public fields for search results
  const publicFields = [
    'user', 'startupName', 'tagline', 'description', 'startupStage',
    'industry', 'rolesSeeking', 'skillsNeeded', 'equityRange', 'cashRange',
    'cashCurrency', 'vestingType', 'intentStatement', 'location',
    'remotePreference', 'hoursPerWeek', 'isSolo', 'existingCofounderCount',
    'experience', 'education', 'totalYearsExperience', 'previousStartupCount',
    'hasPreviousExit', 'socialLinks', 'isVerified', 'createdAt', 'lastActiveAt',
  ].join(' ');

  const [profiles, total] = await Promise.all([
    FounderProfile.find(query)
      .select(publicFields)
      .populate('user', 'name profilePhoto avatarUrl activeRole')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FounderProfile.countDocuments(query),
  ]);

  // Calculate scenario compatibility if requester ID provided
  let profilesWithCompatibility = profiles;
  if (requesterId) {
    const requesterScenario = await ScenarioResponse.findOne({ user: requesterId });
    if (requesterScenario) {
      profilesWithCompatibility = await Promise.all(
        profiles.map(async (profile) => {
          const theirScenario = await ScenarioResponse.findOne({ user: profile.user._id });
          if (theirScenario) {
            const compatibility = await calculateScenarioCompatibility(requesterId, profile.user._id);
            return { ...profile, scenarioCompatibility: compatibility.score };
          }
          return { ...profile, scenarioCompatibility: null };
        })
      );
    }
  }

  return {
    profiles: profilesWithCompatibility,
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
// DISCOVER (BROWSE) PROFILES
// ============================================

/**
 * Discover/browse builder profiles with text search and filters
 * More flexible than search - supports text search across multiple fields
 *
 * @param {Object} filters - Discovery filters
 * @param {string} [filters.search] - Text search (name, headline, skills)
 * @param {number} [filters.minHours] - Minimum hours per week
 * @param {number} [filters.maxHours] - Maximum hours per week
 * @param {string[]} [filters.skills] - Filter by skills
 * @param {string} [filters.riskAppetite] - Risk appetite level
 * @param {string[]} [filters.rolesInterested] - Roles interested in
 * @param {string} [filters.remotePreference] - Remote preference
 * @param {string} [filters.experienceLevel] - Experience level
 * @param {boolean} [filters.isVisible] - Visibility filter (default: true)
 * @param {Object} [options={}] - Pagination options
 * @param {string} [options.requesterId] - ID of user making the request
 * @returns {Promise<Object>} Paginated builder profiles
 */
const discoverBuilderProfiles = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt', requesterId } = options;

  const query = {
    isComplete: true,
  };

  // Visibility filter (default to visible only)
  if (filters.isVisible !== undefined) {
    query.isVisible = filters.isVisible === 'true' || filters.isVisible === true;
  } else {
    query.isVisible = true;
  }

  // Open to opportunities filter
  if (filters.isOpenToOpportunities !== undefined) {
    query.isOpenToOpportunities = filters.isOpenToOpportunities === 'true' || filters.isOpenToOpportunities === true;
  }

  // Exclude the requester from results
  if (requesterId) {
    query.user = { $ne: requesterId };
  }

  // Text search across name, headline, skills
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { displayName: searchRegex },
      { headline: searchRegex },
      { skills: searchRegex },
      { bio: searchRegex },
    ];
  }

  // Hours range filter
  if (filters.minHours !== undefined) {
    query.hoursPerWeek = query.hoursPerWeek || {};
    query.hoursPerWeek.$gte = parseInt(filters.minHours, 10);
  }
  if (filters.maxHours !== undefined) {
    query.hoursPerWeek = query.hoursPerWeek || {};
    query.hoursPerWeek.$lte = parseInt(filters.maxHours, 10);
  }

  // Skills filter (any match)
  if (filters.skills && filters.skills.length > 0) {
    const skillsArray = Array.isArray(filters.skills) ? filters.skills : [filters.skills];
    query.skills = { $in: skillsArray };
  }

  // Risk appetite filter
  if (filters.riskAppetite) {
    query.riskAppetite = filters.riskAppetite;
  }

  // Roles interested filter
  if (filters.rolesInterested && filters.rolesInterested.length > 0) {
    const rolesArray = Array.isArray(filters.rolesInterested) ? filters.rolesInterested : [filters.rolesInterested];
    query.rolesInterested = { $in: rolesArray };
  }

  // Remote preference filter
  if (filters.remotePreference) {
    query.remotePreference = filters.remotePreference;
  }

  // Experience level filter
  if (filters.experienceLevel) {
    query.experienceLevel = filters.experienceLevel;
  }

  // Location filter
  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }

  const skip = (page - 1) * limit;

  // Parse sort option
  let sortOption = '-createdAt';
  if (sort === 'newest') sortOption = '-createdAt';
  else if (sort === 'oldest') sortOption = 'createdAt';
  else if (sort === 'lastActive') sortOption = '-lastActiveAt';
  else if (sort === 'hoursDesc') sortOption = '-hoursPerWeek';
  else if (sort === 'hoursAsc') sortOption = 'hoursPerWeek';
  else sortOption = sort;

  // Select public fields for discovery results
  const publicFields = [
    'user', 'displayName', 'headline', 'bio', 'skills', 'primarySkills',
    'riskAppetite', 'compensationOpenness', 'hoursPerWeek', 'durationPreference',
    'intentStatement', 'location', 'remotePreference', 'rolesInterested',
    'experienceLevel', 'yearsOfExperience', 'experience', 'education',
    'portfolioLinks', 'socialLinks', 'isVerified', 'isOpenToOpportunities',
    'createdAt', 'lastActiveAt',
  ].join(' ');

  const [profiles, total] = await Promise.all([
    BuilderProfile.find(query)
      .select(publicFields)
      .populate('user', 'name profilePhoto avatarUrl activeRole')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    BuilderProfile.countDocuments(query),
  ]);

  // Calculate scenario compatibility if requester ID provided
  let profilesWithCompatibility = profiles;
  if (requesterId) {
    const requesterScenario = await ScenarioResponse.findOne({ user: requesterId });
    if (requesterScenario) {
      profilesWithCompatibility = await Promise.all(
        profiles.map(async (profile) => {
          if (profile.user && profile.user._id) {
            const theirScenario = await ScenarioResponse.findOne({ user: profile.user._id });
            if (theirScenario) {
              const compatibility = await calculateScenarioCompatibility(requesterId, profile.user._id);
              return { ...profile, scenarioCompatibility: compatibility.score };
            }
          }
          return { ...profile, scenarioCompatibility: null };
        })
      );
    }
  }

  return {
    profiles: profilesWithCompatibility,
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
 * Discover/browse founder profiles with text search and filters
 *
 * @param {Object} filters - Discovery filters
 * @param {string} [filters.search] - Text search (startup name, tagline, description)
 * @param {string} [filters.startupStage] - Startup stage
 * @param {string[]} [filters.rolesSeeking] - Roles being offered
 * @param {string[]} [filters.industry] - Industry filter
 * @param {number} [filters.minEquity] - Minimum equity offered
 * @param {number} [filters.maxEquity] - Maximum equity offered
 * @param {string} [filters.remotePreference] - Remote preference
 * @param {boolean} [filters.isVisible] - Visibility filter (default: true)
 * @param {Object} [options={}] - Pagination options
 * @param {string} [options.requesterId] - ID of user making the request
 * @returns {Promise<Object>} Paginated founder profiles
 */
const discoverFounderProfiles = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt', requesterId } = options;

  const query = {
    isComplete: true,
  };

  // Visibility filter (default to visible only)
  if (filters.isVisible !== undefined) {
    query.isVisible = filters.isVisible === 'true' || filters.isVisible === true;
  } else {
    query.isVisible = true;
  }

  // Exclude the requester from results
  if (requesterId) {
    query.user = { $ne: requesterId };
  }

  // Text search across startup name, tagline, description
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { startupName: searchRegex },
      { tagline: searchRegex },
      { description: searchRegex },
      { skillsNeeded: searchRegex },
    ];
  }

  // Startup stage filter
  if (filters.startupStage) {
    query.startupStage = filters.startupStage;
  }

  // Roles seeking filter
  if (filters.rolesSeeking && filters.rolesSeeking.length > 0) {
    const rolesArray = Array.isArray(filters.rolesSeeking) ? filters.rolesSeeking : [filters.rolesSeeking];
    query.rolesSeeking = { $in: rolesArray };
  }

  // Industry filter
  if (filters.industry && filters.industry.length > 0) {
    const industryArray = Array.isArray(filters.industry) ? filters.industry : [filters.industry];
    query.industry = { $in: industryArray };
  }

  // Equity range filter
  if (filters.minEquity !== undefined) {
    query['equityRange.max'] = { $gte: parseFloat(filters.minEquity) };
  }
  if (filters.maxEquity !== undefined) {
    query['equityRange.min'] = { $lte: parseFloat(filters.maxEquity) };
  }

  // Remote preference filter
  if (filters.remotePreference) {
    query.remotePreference = filters.remotePreference;
  }

  // Location filter
  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }

  const skip = (page - 1) * limit;

  // Parse sort option
  let sortOption = '-createdAt';
  if (sort === 'newest') sortOption = '-createdAt';
  else if (sort === 'oldest') sortOption = 'createdAt';
  else if (sort === 'lastActive') sortOption = '-lastActiveAt';
  else sortOption = sort;

  // Select public fields for discovery results
  const publicFields = [
    'user', 'startupName', 'tagline', 'description', 'startupStage',
    'industry', 'rolesSeeking', 'skillsNeeded', 'equityRange', 'cashRange',
    'cashCurrency', 'vestingType', 'intentStatement', 'location',
    'remotePreference', 'hoursPerWeek', 'isSolo', 'existingCofounderCount',
    'experience', 'education', 'totalYearsExperience', 'previousStartupCount',
    'hasPreviousExit', 'socialLinks', 'isVerified', 'createdAt', 'lastActiveAt',
  ].join(' ');

  const [profiles, total] = await Promise.all([
    FounderProfile.find(query)
      .select(publicFields)
      .populate('user', 'name profilePhoto avatarUrl activeRole')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    FounderProfile.countDocuments(query),
  ]);

  // Calculate scenario compatibility if requester ID provided
  let profilesWithCompatibility = profiles;
  if (requesterId) {
    const requesterScenario = await ScenarioResponse.findOne({ user: requesterId });
    if (requesterScenario) {
      profilesWithCompatibility = await Promise.all(
        profiles.map(async (profile) => {
          if (profile.user && profile.user._id) {
            const theirScenario = await ScenarioResponse.findOne({ user: profile.user._id });
            if (theirScenario) {
              const compatibility = await calculateScenarioCompatibility(requesterId, profile.user._id);
              return { ...profile, scenarioCompatibility: compatibility.score };
            }
          }
          return { ...profile, scenarioCompatibility: null };
        })
      );
    }
  }

  return {
    profiles: profilesWithCompatibility,
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

  // Discover (browse)
  discoverBuilderProfiles,
  discoverFounderProfiles,
};
