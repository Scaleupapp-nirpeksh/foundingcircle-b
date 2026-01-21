/**
 * @fileoverview Opening Controller
 *
 * Handles all opening-related HTTP endpoints:
 * - Creating and managing openings
 * - Opening search and discovery
 * - Opening status management
 * - Opening analytics
 *
 * @module controllers/opening
 */

const openingService = require('../services/opening.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// OPENING CRUD
// ============================================

/**
 * Create a new opening
 *
 * @route POST /api/v1/openings
 * @access Private (Founders only)
 *
 * @param {Object} req.body - Opening data
 * @param {string} req.body.title - Opening title
 * @param {string} req.body.roleType - Role type (COFOUNDER, EMPLOYEE, etc.)
 * @param {string} [req.body.description] - Detailed description
 * @param {string[]} [req.body.skillsRequired] - Required skills
 * @param {Object} [req.body.equityRange] - Equity range { min, max }
 * @param {Object} [req.body.cashRange] - Cash range { min, max }
 *
 * @returns {Object} Created opening
 */
const createOpening = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const openingData = req.body;

  const opening = await openingService.createOpening(founderId, openingData);

  return ApiResponse.created('Opening created successfully', { opening }).send(res);
});

/**
 * Get opening by ID
 *
 * @route GET /api/v1/openings/:id
 * @access Private
 *
 * @param {string} req.params.id - Opening ID
 * @param {boolean} [req.query.includeFounder] - Include founder details
 *
 * @returns {Object} Opening
 */
const getOpeningById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const includeFounder = req.query.includeFounder === 'true';

  const opening = await openingService.getOpeningById(id, { includeFounder });

  // Increment view count (async, don't await)
  openingService.incrementOpeningViews(id).catch(() => {});

  return ApiResponse.ok('Opening retrieved successfully', { opening }).send(res);
});

/**
 * Update an opening
 *
 * @route PATCH /api/v1/openings/:id
 * @access Private (Owner only)
 *
 * @param {string} req.params.id - Opening ID
 * @param {Object} req.body - Update data
 *
 * @returns {Object} Updated opening
 */
const updateOpening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const founderId = req.user._id;
  const updateData = req.body;

  const opening = await openingService.updateOpening(id, founderId, updateData);

  return ApiResponse.updated('Opening updated successfully', { opening }).send(res);
});

/**
 * Delete an opening (soft delete)
 *
 * @route DELETE /api/v1/openings/:id
 * @access Private (Owner only)
 *
 * @param {string} req.params.id - Opening ID
 *
 * @returns {Object} Success message
 */
const deleteOpening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const founderId = req.user._id;

  await openingService.deleteOpening(id, founderId);

  return ApiResponse.ok('Opening deleted successfully').send(res);
});

// ============================================
// OPENING STATUS MANAGEMENT
// ============================================

/**
 * Pause an opening
 *
 * @route POST /api/v1/openings/:id/pause
 * @access Private (Owner only)
 *
 * @param {string} req.params.id - Opening ID
 *
 * @returns {Object} Paused opening
 */
const pauseOpening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const founderId = req.user._id;

  const opening = await openingService.pauseOpening(id, founderId);

  return ApiResponse.ok('Opening paused successfully', { opening }).send(res);
});

/**
 * Resume a paused opening
 *
 * @route POST /api/v1/openings/:id/resume
 * @access Private (Owner only)
 *
 * @param {string} req.params.id - Opening ID
 *
 * @returns {Object} Active opening
 */
const resumeOpening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const founderId = req.user._id;

  const opening = await openingService.resumeOpening(id, founderId);

  return ApiResponse.ok('Opening resumed successfully', { opening }).send(res);
});

/**
 * Mark an opening as filled
 *
 * @route POST /api/v1/openings/:id/fill
 * @access Private (Owner only)
 *
 * @param {string} req.params.id - Opening ID
 * @param {string} [req.body.filledBy] - Builder ID who filled the role
 *
 * @returns {Object} Filled opening
 */
const markOpeningFilled = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const founderId = req.user._id;
  const { filledBy } = req.body;

  const opening = await openingService.markOpeningFilled(id, founderId, filledBy);

  return ApiResponse.ok('Opening marked as filled', { opening }).send(res);
});

// ============================================
// FOUNDER OPENINGS
// ============================================

/**
 * Get current founder's openings
 *
 * @route GET /api/v1/openings/my
 * @access Private (Founders only)
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated openings
 */
const getMyOpenings = asyncHandler(async (req, res) => {
  const founderId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await openingService.getFounderOpenings(founderId, {
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.openings,
    result.pagination,
    'Openings retrieved successfully'
  ).send(res);
});

/**
 * Get current founder's opening statistics
 *
 * @route GET /api/v1/openings/my/stats
 * @access Private (Founders only)
 *
 * @returns {Object} Opening statistics
 */
const getMyOpeningStats = asyncHandler(async (req, res) => {
  const founderId = req.user._id;

  const stats = await openingService.getFounderOpeningStats(founderId);

  return ApiResponse.ok('Opening statistics retrieved', stats).send(res);
});

// ============================================
// DISCOVERY & SEARCH
// ============================================

/**
 * Search openings
 *
 * @route GET /api/v1/openings
 * @access Private (requires complete profile)
 *
 * @param {string} [req.query.roleType] - Filter by role type
 * @param {string[]} [req.query.skills] - Filter by skills
 * @param {string} [req.query.startupStage] - Filter by startup stage
 * @param {number} [req.query.minEquity] - Minimum equity
 * @param {string} [req.query.remotePreference] - Remote preference
 * @param {string} [req.query.location] - Location filter
 * @param {string} [req.query.search] - Text search
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 * @param {string} [req.query.sort=-createdAt] - Sort order
 *
 * @returns {Object} Paginated openings
 */
const searchOpenings = asyncHandler(async (req, res) => {
  const {
    roleType,
    skills,
    startupStage,
    minEquity,
    remotePreference,
    location,
    search,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  const filters = {};
  if (roleType) filters.roleType = roleType;
  if (skills) filters.skills = Array.isArray(skills) ? skills : [skills];
  if (startupStage) filters.startupStage = startupStage;
  if (minEquity) filters.minEquity = parseFloat(minEquity);
  if (remotePreference) filters.remotePreference = remotePreference;
  if (location) filters.location = location;
  if (search) filters.search = search;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
  };

  const result = await openingService.searchOpenings(filters, options);

  return ApiResponse.paginated(
    result.openings,
    result.pagination,
    'Openings retrieved successfully'
  ).send(res);
});

/**
 * Get openings by role type
 *
 * @route GET /api/v1/openings/role/:roleType
 * @access Private
 *
 * @param {string} req.params.roleType - Role type
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated openings
 */
const getOpeningsByRoleType = asyncHandler(async (req, res) => {
  const { roleType } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const result = await openingService.getOpeningsByRoleType(roleType, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.openings,
    result.pagination,
    'Openings retrieved successfully'
  ).send(res);
});

/**
 * Get featured openings
 *
 * @route GET /api/v1/openings/featured
 * @access Public
 *
 * @param {number} [req.query.limit=10] - Number of openings
 *
 * @returns {Object} Featured openings
 */
const getFeaturedOpenings = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;

  const openings = await openingService.getFeaturedOpenings(limit);

  return ApiResponse.ok('Featured openings retrieved', { openings }).send(res);
});

/**
 * Get openings matching builder's profile
 *
 * @route GET /api/v1/openings/recommended
 * @access Private (Builders only)
 *
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Matched openings
 */
const getRecommendedOpenings = asyncHandler(async (req, res) => {
  const builderId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const result = await openingService.getMatchingOpeningsForBuilder(builderId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.openings,
    result.pagination,
    'Recommended openings retrieved'
  ).send(res);
});

// ============================================
// ANALYTICS (Admin)
// ============================================

/**
 * Get platform-wide opening statistics
 *
 * @route GET /api/v1/openings/stats
 * @access Private (Admin only)
 *
 * @returns {Object} Platform statistics
 */
const getOpeningStatistics = asyncHandler(async (req, res) => {
  const stats = await openingService.getOpeningStatistics();

  return ApiResponse.ok('Opening statistics retrieved', stats).send(res);
});

/**
 * Record interest in an opening
 *
 * @route POST /api/v1/openings/:id/interest
 * @access Private
 *
 * @param {string} req.params.id - Opening ID
 *
 * @returns {Object} Success message
 */
const expressInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Increment interest count
  await openingService.incrementOpeningInterests(id);

  return ApiResponse.ok('Interest recorded successfully').send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // CRUD
  createOpening,
  getOpeningById,
  updateOpening,
  deleteOpening,

  // Status management
  pauseOpening,
  resumeOpening,
  markOpeningFilled,

  // Founder openings
  getMyOpenings,
  getMyOpeningStats,

  // Discovery & search
  searchOpenings,
  getOpeningsByRoleType,
  getFeaturedOpenings,
  getRecommendedOpenings,

  // Analytics
  getOpeningStatistics,
  expressInterest,
};
