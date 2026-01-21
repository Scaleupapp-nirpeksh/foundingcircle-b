/**
 * @fileoverview Opening Service
 * 
 * Handles founder job/role openings:
 * - Creating and managing openings
 * - Opening search and discovery
 * - Opening visibility and status management
 * 
 * Per PRD: Founders can create openings for co-founders, employees, interns, fractional roles
 * 
 * @module services/opening
 */

const { Opening, FounderProfile, User } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const { 
  USER_TYPES, 
  OPENING_STATUS, 
  ROLE_TYPES,
  SUBSCRIPTION_TIERS,
} = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum active openings per subscription tier
 */
const MAX_OPENINGS = {
  [SUBSCRIPTION_TIERS.FREE]: 1,
  [SUBSCRIPTION_TIERS.FOUNDER_PRO]: 5,
};

// ============================================
// OPENING CRUD
// ============================================

/**
 * Create a new opening
 * 
 * @param {string} founderId - Founder's user ID
 * @param {Object} openingData - Opening details
 * @param {string} openingData.title - Opening title
 * @param {string} openingData.roleType - Role type (COFOUNDER, EMPLOYEE, etc.)
 * @param {string} [openingData.description] - Detailed description
 * @param {string[]} [openingData.skillsRequired] - Required skills
 * @param {Object} [openingData.equityRange] - Equity range { min, max }
 * @param {Object} [openingData.cashRange] - Cash range { min, max }
 * @param {string} [openingData.cashCurrency] - Currency (INR, USD, AED)
 * @param {number} [openingData.hoursPerWeek] - Expected hours per week
 * @param {string} [openingData.remotePreference] - Remote preference
 * @returns {Promise<Object>} Created opening
 * @throws {ApiError} If founder not found or limit reached
 */
const createOpening = async (founderId, openingData) => {
  // Verify user is a founder
  const user = await User.findById(founderId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (user.userType !== USER_TYPES.FOUNDER) {
    throw ApiError.forbidden('Only founders can create openings');
  }
  
  // Get founder profile
  const founderProfile = await FounderProfile.findOne({ user: founderId });
  
  if (!founderProfile) {
    throw ApiError.badRequest('Please complete your founder profile first');
  }
  
  // Check opening limit based on subscription
  const activeOpeningsCount = await Opening.countDocuments({
    founder: founderId,
    status: { $in: [OPENING_STATUS.ACTIVE, OPENING_STATUS.PAUSED] },
  });
  
  const maxAllowed = MAX_OPENINGS[user.subscriptionTier] || MAX_OPENINGS[SUBSCRIPTION_TIERS.FREE];
  
  if (activeOpeningsCount >= maxAllowed) {
    throw ApiError.paymentRequired(
      `You've reached your limit of ${maxAllowed} active opening(s). Upgrade to create more.`
    );
  }
  
  // Create opening with founder profile defaults
  const opening = await Opening.create({
    founder: founderId,
    founderProfile: founderProfile._id,
    title: openingData.title,
    roleType: openingData.roleType,
    description: openingData.description,
    skillsRequired: openingData.skillsRequired || [],
    equityRange: openingData.equityRange || founderProfile.equityRange,
    cashRange: openingData.cashRange || founderProfile.cashRange,
    cashCurrency: openingData.cashCurrency || founderProfile.cashCurrency,
    vestingType: openingData.vestingType || founderProfile.vestingType,
    hoursPerWeek: openingData.hoursPerWeek || founderProfile.hoursPerWeek,
    remotePreference: openingData.remotePreference || founderProfile.remotePreference,
    location: openingData.location || founderProfile.location,
    status: OPENING_STATUS.ACTIVE,
  });
  
  logger.info('Opening created', { 
    openingId: opening._id, 
    founderId, 
    roleType: opening.roleType,
  });
  
  return opening;
};

/**
 * Get opening by ID
 * 
 * @param {string} openingId - Opening ID
 * @param {Object} [options={}] - Query options
 * @param {boolean} [options.includeFounder=false] - Include founder details
 * @returns {Promise<Object>} Opening
 * @throws {ApiError} If not found
 */
const getOpeningById = async (openingId, options = {}) => {
  let query = Opening.findById(openingId);
  
  if (options.includeFounder) {
    query = query
      .populate('founder', 'name email avatarUrl')
      .populate('founderProfile', 'startupName tagline startupStage isVerified');
  }
  
  const opening = await query;
  
  if (!opening) {
    throw ApiError.notFound('Opening not found');
  }
  
  return opening;
};

/**
 * Update an opening
 * 
 * @param {string} openingId - Opening ID
 * @param {string} founderId - Founder's user ID (for authorization)
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated opening
 * @throws {ApiError} If not found or unauthorized
 */
const updateOpening = async (openingId, founderId, updateData) => {
  const opening = await Opening.findById(openingId);
  
  if (!opening) {
    throw ApiError.notFound('Opening not found');
  }
  
  // Verify ownership
  if (opening.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only update your own openings');
  }
  
  // Don't allow updating certain fields
  const protectedFields = ['founder', 'founderProfile', 'viewCount', 'interestCount', 'createdAt'];
  protectedFields.forEach(field => delete updateData[field]);
  
  // Update fields
  Object.assign(opening, updateData);
  await opening.save();
  
  logger.info('Opening updated', { openingId, founderId });
  
  return opening;
};

/**
 * Delete an opening (soft delete by setting status to CLOSED)
 * 
 * @param {string} openingId - Opening ID
 * @param {string} founderId - Founder's user ID (for authorization)
 * @returns {Promise<Object>} Closed opening
 * @throws {ApiError} If not found or unauthorized
 */
const deleteOpening = async (openingId, founderId) => {
  const opening = await Opening.findById(openingId);
  
  if (!opening) {
    throw ApiError.notFound('Opening not found');
  }
  
  // Verify ownership
  if (opening.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only delete your own openings');
  }
  
  opening.status = OPENING_STATUS.CLOSED;
  opening.closedAt = new Date();
  await opening.save();
  
  logger.info('Opening closed', { openingId, founderId });
  
  return opening;
};

// ============================================
// OPENING STATUS MANAGEMENT
// ============================================

/**
 * Pause an opening (temporarily hide from discovery)
 * 
 * @param {string} openingId - Opening ID
 * @param {string} founderId - Founder's user ID
 * @returns {Promise<Object>} Paused opening
 */
const pauseOpening = async (openingId, founderId) => {
  const opening = await Opening.findById(openingId);
  
  if (!opening) {
    throw ApiError.notFound('Opening not found');
  }
  
  if (opening.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only pause your own openings');
  }
  
  if (opening.status !== OPENING_STATUS.ACTIVE) {
    throw ApiError.badRequest('Only active openings can be paused');
  }
  
  opening.status = OPENING_STATUS.PAUSED;
  await opening.save();
  
  logger.info('Opening paused', { openingId, founderId });
  
  return opening;
};

/**
 * Resume a paused opening
 * 
 * @param {string} openingId - Opening ID
 * @param {string} founderId - Founder's user ID
 * @returns {Promise<Object>} Active opening
 */
const resumeOpening = async (openingId, founderId) => {
  const opening = await Opening.findById(openingId);
  
  if (!opening) {
    throw ApiError.notFound('Opening not found');
  }
  
  if (opening.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only resume your own openings');
  }
  
  if (opening.status !== OPENING_STATUS.PAUSED) {
    throw ApiError.badRequest('Only paused openings can be resumed');
  }
  
  opening.status = OPENING_STATUS.ACTIVE;
  await opening.save();
  
  logger.info('Opening resumed', { openingId, founderId });
  
  return opening;
};

/**
 * Mark an opening as filled
 * 
 * @param {string} openingId - Opening ID
 * @param {string} founderId - Founder's user ID
 * @param {string} [filledByUserId] - Builder who filled the role
 * @returns {Promise<Object>} Filled opening
 */
const markOpeningFilled = async (openingId, founderId, filledByUserId = null) => {
  const opening = await Opening.findById(openingId);
  
  if (!opening) {
    throw ApiError.notFound('Opening not found');
  }
  
  if (opening.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only mark your own openings as filled');
  }
  
  opening.status = OPENING_STATUS.FILLED;
  opening.filledAt = new Date();
  if (filledByUserId) {
    opening.filledBy = filledByUserId;
  }
  await opening.save();
  
  logger.info('Opening marked as filled', { openingId, founderId, filledByUserId });
  
  return opening;
};

// ============================================
// FOUNDER OPENINGS
// ============================================

/**
 * Get all openings for a founder
 * 
 * @param {string} founderId - Founder's user ID
 * @param {Object} [options={}] - Query options
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Promise<Object>} Paginated openings
 */
const getFounderOpenings = async (founderId, options = {}) => {
  const { status, page = 1, limit = 20 } = options;
  
  const query = { founder: founderId };
  
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  
  const [openings, total] = await Promise.all([
    Opening.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Opening.countDocuments(query),
  ]);
  
  return {
    openings,
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
 * Get opening statistics for a founder
 * 
 * @param {string} founderId - Founder's user ID
 * @returns {Promise<Object>} Opening statistics
 */
const getFounderOpeningStats = async (founderId) => {
  const stats = await Opening.aggregate([
    { $match: { founder: founderId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalInterests: { $sum: '$interestCount' },
      },
    },
  ]);
  
  // Convert to object
  const result = {
    total: 0,
    active: 0,
    paused: 0,
    closed: 0,
    filled: 0,
    totalViews: 0,
    totalInterests: 0,
  };
  
  stats.forEach(stat => {
    const statusKey = stat._id.toLowerCase();
    result[statusKey] = stat.count;
    result.total += stat.count;
    result.totalViews += stat.totalViews;
    result.totalInterests += stat.totalInterests;
  });
  
  return result;
};

// ============================================
// DISCOVERY & SEARCH
// ============================================

/**
 * Search openings for builders
 * 
 * @param {Object} [filters={}] - Search filters
 * @param {string} [filters.roleType] - Filter by role type
 * @param {string[]} [filters.skills] - Filter by required skills
 * @param {string} [filters.startupStage] - Filter by startup stage
 * @param {number} [filters.minEquity] - Minimum equity offered
 * @param {number} [filters.maxCash] - Maximum cash (for equity-focused builders)
 * @param {string} [filters.remotePreference] - Remote preference
 * @param {string} [filters.location] - Location (city)
 * @param {string} [filters.search] - Text search
 * @param {Object} [options={}] - Pagination options
 * @returns {Promise<Object>} Paginated openings
 */
const searchOpenings = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;
  
  // Base query: only active openings
  const query = {
    status: OPENING_STATUS.ACTIVE,
  };
  
  // Role type filter
  if (filters.roleType) {
    query.roleType = filters.roleType;
  }
  
  // Skills filter (any match)
  if (filters.skills && filters.skills.length > 0) {
    query.skillsRequired = { $in: filters.skills };
  }
  
  // Minimum equity filter
  if (filters.minEquity !== undefined) {
    query['equityRange.max'] = { $gte: filters.minEquity };
  }
  
  // Remote preference filter
  if (filters.remotePreference) {
    query.remotePreference = filters.remotePreference;
  }
  
  // Location filter
  if (filters.location) {
    query['location.city'] = new RegExp(filters.location, 'i');
  }
  
  // Text search
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  const skip = (page - 1) * limit;
  
  // Build aggregation for startup stage filter (requires join with founder profile)
  let pipeline = [
    { $match: query },
  ];
  
  // Join with founder profile for startup stage filter
  if (filters.startupStage) {
    pipeline.push(
      {
        $lookup: {
          from: 'founderprofiles',
          localField: 'founderProfile',
          foreignField: '_id',
          as: 'founderProfileData',
        },
      },
      { $unwind: '$founderProfileData' },
      { $match: { 'founderProfileData.startupStage': filters.startupStage } }
    );
  }
  
  // Add pagination
  pipeline.push(
    { $sort: sort === '-createdAt' ? { createdAt: -1 } : { createdAt: 1 } },
    { $skip: skip },
    { $limit: limit }
  );
  
  // Execute queries
  const [openings, totalResult] = await Promise.all([
    Opening.aggregate(pipeline),
    Opening.countDocuments(query),
  ]);
  
  // Populate founder info
  await Opening.populate(openings, [
    { path: 'founder', select: 'name avatarUrl' },
    { path: 'founderProfile', select: 'startupName tagline startupStage isVerified' },
  ]);
  
  return {
    openings,
    pagination: {
      page,
      limit,
      total: totalResult,
      totalPages: Math.ceil(totalResult / limit),
      hasMore: page * limit < totalResult,
    },
  };
};

/**
 * Get openings by role type
 * 
 * @param {string} roleType - Role type (COFOUNDER, EMPLOYEE, etc.)
 * @param {Object} [options={}] - Pagination options
 * @returns {Promise<Object>} Paginated openings
 */
const getOpeningsByRoleType = async (roleType, options = {}) => {
  return searchOpenings({ roleType }, options);
};

/**
 * Get featured/recent openings for homepage
 * 
 * @param {number} [limit=10] - Number of openings to return
 * @returns {Promise<Object[]>} Featured openings
 */
const getFeaturedOpenings = async (limit = 10) => {
  const openings = await Opening.find({
    status: OPENING_STATUS.ACTIVE,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('founder', 'name avatarUrl')
    .populate('founderProfile', 'startupName tagline startupStage isVerified')
    .lean();
  
  return openings;
};

/**
 * Get openings matching builder's profile
 * 
 * @param {string} builderId - Builder's user ID
 * @param {Object} [options={}] - Pagination options
 * @returns {Promise<Object>} Matched openings
 */
const getMatchingOpeningsForBuilder = async (builderId, options = {}) => {
  const { BuilderProfile } = require('../../models');
  const { page = 1, limit = 20 } = options;
  
  // Get builder profile
  const builderProfile = await BuilderProfile.findOne({ user: builderId });
  
  if (!builderProfile) {
    throw ApiError.badRequest('Please complete your builder profile first');
  }
  
  // Build query based on builder preferences
  const query = {
    status: OPENING_STATUS.ACTIVE,
  };
  
  // Match role types
  if (builderProfile.rolesInterested && builderProfile.rolesInterested.length > 0) {
    query.roleType = { $in: builderProfile.rolesInterested };
  }
  
  // Match skills
  if (builderProfile.skills && builderProfile.skills.length > 0) {
    query.skillsRequired = { $in: builderProfile.skills };
  }
  
  // Filter by compensation if builder only wants paid roles
  if (builderProfile.compensationOpenness && 
      builderProfile.compensationOpenness.length === 1 &&
      builderProfile.compensationOpenness[0] === 'PAID_ONLY') {
    query['cashRange.min'] = { $gt: 0 };
  }
  
  const skip = (page - 1) * limit;
  
  const [openings, total] = await Promise.all([
    Opening.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('founder', 'name avatarUrl')
      .populate('founderProfile', 'startupName tagline startupStage isVerified')
      .lean(),
    Opening.countDocuments(query),
  ]);
  
  return {
    openings,
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
// ANALYTICS
// ============================================

/**
 * Increment view count for an opening
 * 
 * @param {string} openingId - Opening ID
 * @returns {Promise<void>}
 */
const incrementOpeningViews = async (openingId) => {
  await Opening.findByIdAndUpdate(openingId, {
    $inc: { viewCount: 1 },
  });
};

/**
 * Increment interest count for an opening
 * 
 * @param {string} openingId - Opening ID
 * @returns {Promise<void>}
 */
const incrementOpeningInterests = async (openingId) => {
  await Opening.findByIdAndUpdate(openingId, {
    $inc: { interestCount: 1 },
  });
};

/**
 * Get opening statistics (for admin)
 * 
 * @returns {Promise<Object>} Platform-wide opening stats
 */
const getOpeningStatistics = async () => {
  const stats = await Opening.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],
        byRoleType: [
          { $match: { status: OPENING_STATUS.ACTIVE } },
          { $group: { _id: '$roleType', count: { $sum: 1 } } },
        ],
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              totalViews: { $sum: '$viewCount' },
              totalInterests: { $sum: '$interestCount' },
            },
          },
        ],
      },
    },
  ]);
  
  return {
    byStatus: stats[0].byStatus,
    byRoleType: stats[0].byRoleType,
    totals: stats[0].totals[0] || { total: 0, totalViews: 0, totalInterests: 0 },
  };
};

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
  getFounderOpenings,
  getFounderOpeningStats,
  
  // Discovery & search
  searchOpenings,
  getOpeningsByRoleType,
  getFeaturedOpenings,
  getMatchingOpeningsForBuilder,
  
  // Analytics
  incrementOpeningViews,
  incrementOpeningInterests,
  getOpeningStatistics,
  
  // Constants
  MAX_OPENINGS,
};
