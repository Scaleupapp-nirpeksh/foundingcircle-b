/**
 * @fileoverview Profile Controller
 *
 * Handles all profile-related HTTP endpoints:
 * - Founder profile management
 * - Builder profile management
 * - Dual profile & role switching
 * - Scenario responses
 * - Profile search & discovery
 *
 * @module controllers/profile
 */

const profileService = require('../services/profile.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// CURRENT USER PROFILE ENDPOINTS
// ============================================

/**
 * Get current user's profile (auto-detects type)
 *
 * @route GET /api/v1/profiles/me
 * @access Private
 *
 * @returns {Object} User profile with completion status
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await profileService.getProfileByUserId(userId);

  return ApiResponse.ok('Profile retrieved successfully', result).send(res);
});

/**
 * Get all profiles for current user (founder & builder)
 *
 * @route GET /api/v1/profiles/me/all
 * @access Private
 *
 * @returns {Object} Both profiles with metadata
 */
const getMyProfiles = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await profileService.getUserProfiles(userId);

  return ApiResponse.ok('Profiles retrieved successfully', result).send(res);
});

/**
 * Get current user's active profile
 *
 * @route GET /api/v1/profiles/me/active
 * @access Private
 *
 * @returns {Object} Active profile with type
 */
const getMyActiveProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await profileService.getActiveProfile(userId);

  return ApiResponse.ok('Active profile retrieved successfully', result).send(res);
});

/**
 * Update current user's profile (auto-detects type)
 *
 * @route PATCH /api/v1/profiles/me
 * @access Private
 *
 * @param {Object} req.body - Profile data to update
 * @param {string} [req.query.type] - Optional: 'founder' or 'builder'
 *
 * @returns {Object} Updated profile
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileData = req.body;
  const profileType = req.query.type?.toUpperCase();

  const profile = await profileService.updateProfile(userId, profileData, profileType);

  return ApiResponse.updated('Profile updated successfully', { profile }).send(res);
});

/**
 * Check if current user can create a specific profile type
 *
 * @route GET /api/v1/profiles/me/can-create/:type
 * @access Private
 *
 * @param {string} req.params.type - Profile type ('founder' or 'builder')
 *
 * @returns {Object} Can create status and reason
 */
const canCreateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileType = req.params.type.toUpperCase();

  const result = await profileService.canCreateProfile(userId, profileType);

  return ApiResponse.ok('Profile creation check completed', result).send(res);
});

// ============================================
// FOUNDER PROFILE ENDPOINTS
// ============================================

/**
 * Create founder profile for current user
 *
 * @route POST /api/v1/profiles/founder
 * @access Private
 *
 * @param {Object} req.body - Founder profile data
 *
 * @returns {Object} Created founder profile
 */
const createFounderProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileData = req.body;

  const profile = await profileService.createFounderProfile(userId, profileData);

  return ApiResponse.profileCompleted({ profile }, 'Founder profile created successfully').send(res);
});

/**
 * Get current user's founder profile
 *
 * @route GET /api/v1/profiles/founder/me
 * @access Private
 *
 * @returns {Object} Founder profile
 */
const getMyFounderProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await profileService.getFounderProfile(userId);

  return ApiResponse.ok('Founder profile retrieved successfully', { profile }).send(res);
});

/**
 * Update current user's founder profile
 *
 * @route PATCH /api/v1/profiles/founder/me
 * @access Private
 *
 * @param {Object} req.body - Profile data to update
 *
 * @returns {Object} Updated founder profile
 */
const updateMyFounderProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileData = req.body;

  const profile = await profileService.updateFounderProfile(userId, profileData);

  return ApiResponse.updated('Founder profile updated successfully', { profile }).send(res);
});

/**
 * Get founder profile completion status
 *
 * @route GET /api/v1/profiles/founder/me/completion
 * @access Private
 *
 * @returns {Object} Completion percentage and missing fields
 */
const getFounderProfileCompletion = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await profileService.getFounderProfileCompletion(userId);

  return ApiResponse.ok('Completion status retrieved', result).send(res);
});

/**
 * Get founder profile by ID (for viewing other profiles)
 *
 * @route GET /api/v1/profiles/founder/:id
 * @access Private
 *
 * @param {string} req.params.id - Profile ID
 *
 * @returns {Object} Founder profile
 */
const getFounderProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await profileService.getFounderProfileById(id);

  return ApiResponse.ok('Founder profile retrieved successfully', { profile }).send(res);
});

// ============================================
// BUILDER PROFILE ENDPOINTS
// ============================================

/**
 * Create builder profile for current user
 *
 * @route POST /api/v1/profiles/builder
 * @access Private
 *
 * @param {Object} req.body - Builder profile data
 *
 * @returns {Object} Created builder profile
 */
const createBuilderProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileData = req.body;

  const profile = await profileService.createBuilderProfile(userId, profileData);

  return ApiResponse.profileCompleted({ profile }, 'Builder profile created successfully').send(res);
});

/**
 * Get current user's builder profile
 *
 * @route GET /api/v1/profiles/builder/me
 * @access Private
 *
 * @returns {Object} Builder profile
 */
const getMyBuilderProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await profileService.getBuilderProfile(userId);

  return ApiResponse.ok('Builder profile retrieved successfully', { profile }).send(res);
});

/**
 * Update current user's builder profile
 *
 * @route PATCH /api/v1/profiles/builder/me
 * @access Private
 *
 * @param {Object} req.body - Profile data to update
 *
 * @returns {Object} Updated builder profile
 */
const updateMyBuilderProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileData = req.body;

  const profile = await profileService.updateBuilderProfile(userId, profileData);

  return ApiResponse.updated('Builder profile updated successfully', { profile }).send(res);
});

/**
 * Get builder profile completion status
 *
 * @route GET /api/v1/profiles/builder/me/completion
 * @access Private
 *
 * @returns {Object} Completion percentage and missing fields
 */
const getBuilderProfileCompletion = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await profileService.getBuilderProfileCompletion(userId);

  return ApiResponse.ok('Completion status retrieved', result).send(res);
});

/**
 * Get builder profile by ID (for viewing other profiles)
 *
 * @route GET /api/v1/profiles/builder/:id
 * @access Private
 *
 * @param {string} req.params.id - Profile ID
 *
 * @returns {Object} Builder profile
 */
const getBuilderProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await profileService.getBuilderProfileById(id);

  return ApiResponse.ok('Builder profile retrieved successfully', { profile }).send(res);
});

// ============================================
// DUAL PROFILE & ROLE SWITCHING
// ============================================

/**
 * Add a secondary profile (dual profile support)
 *
 * @route POST /api/v1/profiles/secondary/:type
 * @access Private
 *
 * @param {string} req.params.type - Profile type ('founder' or 'builder')
 * @param {Object} req.body - Profile data
 *
 * @returns {Object} Created secondary profile
 */
const addSecondaryProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileType = req.params.type.toUpperCase();
  const profileData = req.body;

  const profile = await profileService.addSecondaryProfile(userId, profileType, profileData);

  return ApiResponse.profileCompleted(
    { profile },
    `Secondary ${profileType.toLowerCase()} profile created successfully`
  ).send(res);
});

/**
 * Switch active role
 *
 * @route POST /api/v1/profiles/switch-role
 * @access Private
 *
 * @param {Object} req.body
 * @param {string} req.body.role - Role to switch to ('founder' or 'builder')
 *
 * @returns {Object} Updated user with new active role
 */
const switchRole = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { role } = req.body;

  const user = await profileService.switchActiveRole(userId, role.toUpperCase());

  return ApiResponse.ok('Role switched successfully', {
    activeRole: user.activeRole,
    userId: user._id,
  }).send(res);
});

// ============================================
// SCENARIO RESPONSES
// ============================================

/**
 * Save scenario responses
 *
 * @route POST /api/v1/profiles/scenarios
 * @access Private
 *
 * @param {Object} req.body
 * @param {string} req.body.scenario1 - Response A/B/C/D
 * @param {string} req.body.scenario2 - Response A/B/C/D
 * @param {string} req.body.scenario3 - Response A/B/C/D
 * @param {string} req.body.scenario4 - Response A/B/C/D
 * @param {string} req.body.scenario5 - Response A/B/C/D
 * @param {string} req.body.scenario6 - Response A/B/C/D
 *
 * @returns {Object} Saved scenario responses
 */
const saveScenarios = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const responses = req.body;

  const result = await profileService.saveScenarioResponses(userId, responses);

  return ApiResponse.created('Scenario responses saved successfully', { scenarios: result }).send(res);
});

/**
 * Get current user's scenario responses
 *
 * @route GET /api/v1/profiles/scenarios/me
 * @access Private
 *
 * @returns {Object} Scenario responses
 */
const getMyScenarios = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const scenarios = await profileService.getScenarioResponses(userId);

  return ApiResponse.ok('Scenario responses retrieved', { scenarios }).send(res);
});

/**
 * Calculate scenario compatibility with another user
 *
 * @route GET /api/v1/profiles/scenarios/compatibility/:userId
 * @access Private
 *
 * @param {string} req.params.userId - Other user's ID
 *
 * @returns {Object} Compatibility score and breakdown
 */
const getScenarioCompatibility = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId } = req.params;

  const result = await profileService.calculateScenarioCompatibility(currentUserId, userId);

  return ApiResponse.ok('Compatibility calculated', result).send(res);
});

// ============================================
// SEARCH & DISCOVERY
// ============================================

/**
 * Search builder profiles
 *
 * @route GET /api/v1/profiles/search/builders
 * @access Private
 *
 * @param {string[]} [req.query.skills] - Filter by skills
 * @param {string} [req.query.riskAppetite] - Filter by risk appetite
 * @param {string[]} [req.query.compensationOpenness] - Filter by compensation preferences
 * @param {number} [req.query.minHours] - Minimum hours per week
 * @param {string} [req.query.location] - Filter by location
 * @param {string[]} [req.query.rolesInterested] - Filter by roles
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated builder profiles
 */
const searchBuilders = asyncHandler(async (req, res) => {
  const {
    skills,
    riskAppetite,
    compensationOpenness,
    minHours,
    location,
    rolesInterested,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  const filters = {};
  if (skills) filters.skills = Array.isArray(skills) ? skills : [skills];
  if (riskAppetite) filters.riskAppetite = riskAppetite;
  if (compensationOpenness) {
    filters.compensationOpenness = Array.isArray(compensationOpenness)
      ? compensationOpenness
      : [compensationOpenness];
  }
  if (minHours) filters.minHours = parseInt(minHours, 10);
  if (location) filters.location = location;
  if (rolesInterested) {
    filters.rolesInterested = Array.isArray(rolesInterested)
      ? rolesInterested
      : [rolesInterested];
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    requesterId: req.user._id, // For scenario compatibility calculation
  };

  const result = await profileService.searchBuilderProfiles(filters, options);

  return ApiResponse.paginated(
    result.profiles,
    result.pagination,
    'Builder profiles retrieved successfully'
  ).send(res);
});

/**
 * Search founder profiles
 *
 * @route GET /api/v1/profiles/search/founders
 * @access Private
 *
 * @param {string} [req.query.startupStage] - Filter by startup stage
 * @param {string[]} [req.query.rolesSeeking] - Filter by roles offered
 * @param {number} [req.query.minEquity] - Minimum equity offered
 * @param {number} [req.query.minCash] - Minimum cash offered
 * @param {string} [req.query.location] - Filter by location
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated founder profiles
 */
const searchFounders = asyncHandler(async (req, res) => {
  const {
    startupStage,
    rolesSeeking,
    minEquity,
    minCash,
    location,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  const filters = {};
  if (startupStage) filters.startupStage = startupStage;
  if (rolesSeeking) {
    filters.rolesSeeking = Array.isArray(rolesSeeking) ? rolesSeeking : [rolesSeeking];
  }
  if (minEquity) filters.minEquity = parseFloat(minEquity);
  if (minCash) filters.minCash = parseInt(minCash, 10);
  if (location) filters.location = location;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    requesterId: req.user._id, // For scenario compatibility calculation
  };

  const result = await profileService.searchFounderProfiles(filters, options);

  return ApiResponse.paginated(
    result.profiles,
    result.pagination,
    'Founder profiles retrieved successfully'
  ).send(res);
});

// ============================================
// DISCOVER (BROWSE) PROFILES
// ============================================

/**
 * Discover/browse builder profiles with text search
 *
 * @route GET /api/v1/profiles/builder/discover
 * @access Private
 *
 * @param {string} [req.query.search] - Text search (name, headline, skills)
 * @param {number} [req.query.minHours] - Minimum hours per week
 * @param {number} [req.query.maxHours] - Maximum hours per week
 * @param {string[]} [req.query.skills] - Filter by skills
 * @param {string} [req.query.riskAppetite] - Filter by risk appetite
 * @param {string[]} [req.query.rolesInterested] - Filter by roles
 * @param {string} [req.query.remotePreference] - Filter by remote preference
 * @param {string} [req.query.experienceLevel] - Filter by experience level
 * @param {string} [req.query.location] - Filter by location
 * @param {boolean} [req.query.isVisible] - Filter by visibility
 * @param {string} [req.query.sort] - Sort option (newest, oldest, lastActive)
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated builder profiles
 */
const discoverBuilders = asyncHandler(async (req, res) => {
  const {
    search,
    minHours,
    maxHours,
    skills,
    riskAppetite,
    rolesInterested,
    remotePreference,
    experienceLevel,
    location,
    isVisible,
    isOpenToOpportunities,
    page = 1,
    limit = 20,
    sort = 'newest',
  } = req.query;

  const filters = {};
  if (search) filters.search = search;
  if (minHours !== undefined) filters.minHours = minHours;
  if (maxHours !== undefined) filters.maxHours = maxHours;
  if (skills) filters.skills = Array.isArray(skills) ? skills : [skills];
  if (riskAppetite) filters.riskAppetite = riskAppetite;
  if (rolesInterested) {
    filters.rolesInterested = Array.isArray(rolesInterested) ? rolesInterested : [rolesInterested];
  }
  if (remotePreference) filters.remotePreference = remotePreference;
  if (experienceLevel) filters.experienceLevel = experienceLevel;
  if (location) filters.location = location;
  if (isVisible !== undefined) filters.isVisible = isVisible;
  if (isOpenToOpportunities !== undefined) filters.isOpenToOpportunities = isOpenToOpportunities;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    requesterId: req.user._id,
  };

  const result = await profileService.discoverBuilderProfiles(filters, options);

  return ApiResponse.paginated(
    result.profiles,
    result.pagination,
    'Builder profiles retrieved successfully'
  ).send(res);
});

/**
 * Discover/browse founder profiles with text search
 *
 * @route GET /api/v1/profiles/founder/discover
 * @access Private
 *
 * @param {string} [req.query.search] - Text search (startup name, tagline, description)
 * @param {string} [req.query.startupStage] - Filter by startup stage
 * @param {string[]} [req.query.rolesSeeking] - Filter by roles offered
 * @param {string[]} [req.query.industry] - Filter by industry
 * @param {number} [req.query.minEquity] - Minimum equity offered
 * @param {number} [req.query.maxEquity] - Maximum equity offered
 * @param {string} [req.query.remotePreference] - Filter by remote preference
 * @param {string} [req.query.location] - Filter by location
 * @param {boolean} [req.query.isVisible] - Filter by visibility
 * @param {string} [req.query.sort] - Sort option (newest, oldest, lastActive)
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated founder profiles
 */
const discoverFounders = asyncHandler(async (req, res) => {
  const {
    search,
    startupStage,
    rolesSeeking,
    industry,
    minEquity,
    maxEquity,
    remotePreference,
    location,
    isVisible,
    page = 1,
    limit = 20,
    sort = 'newest',
  } = req.query;

  const filters = {};
  if (search) filters.search = search;
  if (startupStage) filters.startupStage = startupStage;
  if (rolesSeeking) {
    filters.rolesSeeking = Array.isArray(rolesSeeking) ? rolesSeeking : [rolesSeeking];
  }
  if (industry) {
    filters.industry = Array.isArray(industry) ? industry : [industry];
  }
  if (minEquity !== undefined) filters.minEquity = minEquity;
  if (maxEquity !== undefined) filters.maxEquity = maxEquity;
  if (remotePreference) filters.remotePreference = remotePreference;
  if (location) filters.location = location;
  if (isVisible !== undefined) filters.isVisible = isVisible;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    requesterId: req.user._id,
  };

  const result = await profileService.discoverFounderProfiles(filters, options);

  return ApiResponse.paginated(
    result.profiles,
    result.pagination,
    'Founder profiles retrieved successfully'
  ).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Current user profile
  getMyProfile,
  getMyProfiles,
  getMyActiveProfile,
  updateMyProfile,
  canCreateProfile,

  // Founder profile
  createFounderProfile,
  getMyFounderProfile,
  updateMyFounderProfile,
  getFounderProfileCompletion,
  getFounderProfileById,

  // Builder profile
  createBuilderProfile,
  getMyBuilderProfile,
  updateMyBuilderProfile,
  getBuilderProfileCompletion,
  getBuilderProfileById,

  // Dual profile & role switching
  addSecondaryProfile,
  switchRole,

  // Scenarios
  saveScenarios,
  getMyScenarios,
  getScenarioCompatibility,

  // Search & discovery
  searchBuilders,
  searchFounders,

  // Discover (browse)
  discoverBuilders,
  discoverFounders,
};
