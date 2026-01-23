/**
 * @fileoverview Interest Service
 * 
 * Handles the interest/matching flow between builders and openings:
 * - Builder expressing interest in openings
 * - Founder shortlisting/passing on interested builders
 * - Mutual match detection
 * - Interest analytics
 * 
 * Per PRD: Interest → Shortlist → Mutual Match → Chat unlocked
 * 
 * @module services/interest
 */

const { Interest, Opening, BuilderProfile, FounderProfile, User } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const {
  USER_TYPES,
  INTEREST_STATUS,
  OPENING_STATUS,
  SUBSCRIPTION_TIERS,
} = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');
const socketService = require('../../../socket/socketService');
const notificationService = require('../../notification/services/notification.service');

// ============================================
// CONSTANTS
// ============================================

/**
 * Daily interest limits per subscription tier
 */
const DAILY_INTEREST_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: 5,
  [SUBSCRIPTION_TIERS.BUILDER_BOOST]: 15,
};

// ============================================
// BUILDER ACTIONS
// ============================================

/**
 * Express interest in an opening (Builder action)
 * 
 * @param {string} builderId - Builder's user ID
 * @param {string} openingId - Opening ID
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.note] - Optional note to founder
 * @returns {Promise<Object>} Created interest
 * @throws {ApiError} If validation fails or limit reached
 */
const expressInterest = async (builderId, openingId, options = {}) => {
  // Verify user is a builder
  const user = await User.findById(builderId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (user.userType !== USER_TYPES.BUILDER) {
    throw ApiError.forbidden('Only builders can express interest in openings');
  }
  
  // Check builder profile exists
  const builderProfile = await BuilderProfile.findOne({ user: builderId });
  
  if (!builderProfile) {
    throw ApiError.badRequest('Please complete your builder profile first');
  }
  
  if (!builderProfile.isComplete) {
    throw ApiError.badRequest('Please complete your builder profile first');
  }
  
  // Check opening exists and is active
  const opening = await Opening.findById(openingId);
  
  if (!opening) {
    throw ApiError.notFound('Opening not found');
  }
  
  if (opening.status !== OPENING_STATUS.ACTIVE) {
    throw ApiError.badRequest('This opening is no longer accepting interests');
  }
  
  // Check if already expressed interest
  const existingInterest = await Interest.findOne({
    builder: builderId,
    opening: openingId,
  });
  
  if (existingInterest) {
    throw ApiError.conflict('You have already expressed interest in this opening');
  }
  
  // Check daily limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayInterests = await Interest.countDocuments({
    builder: builderId,
    createdAt: { $gte: todayStart },
  });
  
  const dailyLimit = DAILY_INTEREST_LIMITS[user.subscriptionTier] || DAILY_INTEREST_LIMITS[SUBSCRIPTION_TIERS.FREE];
  
  if (todayInterests >= dailyLimit) {
    throw ApiError.dailyLimitReached(
      `You've reached your daily limit of ${dailyLimit} interests. Upgrade for more.`
    );
  }
  
  // Create interest
  const interest = await Interest.create({
    builder: builderId,
    builderProfile: builderProfile._id,
    opening: openingId,
    founder: opening.founder,
    status: INTEREST_STATUS.INTERESTED,
    builderNote: options.note || null,
  });
  
  // Update opening interest count
  await Opening.findByIdAndUpdate(openingId, {
    $inc: { interestCount: 1 },
  });
  
  // Update builder profile interest count
  await builderProfile.incrementInterestsSent();

  // ============================================
  // REAL-TIME NOTIFICATIONS
  // ============================================

  // Notify founder via socket
  socketService.emitNewInterest(opening.founder.toString(), {
    _id: interest._id,
    builder: { _id: builderId, name: user.name, avatarUrl: user.avatarUrl },
    opening: { _id: openingId, title: opening.title },
    builderNote: options.note,
    createdAt: interest.createdAt,
  });

  // Create notification for founder
  try {
    await notificationService.notifyNewInterest({
      founderId: opening.founder,
      builder: { _id: builderId, name: user.name, avatarUrl: user.avatarUrl },
      opening: { _id: openingId, title: opening.title },
      interestId: interest._id,
    });
  } catch (notifError) {
    logger.warn('Failed to create interest notification', { error: notifError.message });
  }

  logger.info('Interest expressed', {
    interestId: interest._id,
    builderId,
    openingId,
  });

  return interest;
};

/**
 * Withdraw interest from an opening (Builder action)
 * 
 * @param {string} builderId - Builder's user ID
 * @param {string} interestId - Interest ID
 * @returns {Promise<Object>} Updated interest
 */
const withdrawInterest = async (builderId, interestId) => {
  const interest = await Interest.findById(interestId);
  
  if (!interest) {
    throw ApiError.notFound('Interest not found');
  }
  
  if (interest.builder.toString() !== builderId.toString()) {
    throw ApiError.forbidden('You can only withdraw your own interests');
  }
  
  if (interest.status === INTEREST_STATUS.WITHDRAWN) {
    throw ApiError.badRequest('Interest already withdrawn');
  }
  
  interest.status = INTEREST_STATUS.WITHDRAWN;
  interest.withdrawnAt = new Date();
  await interest.save();
  
  logger.info('Interest withdrawn', { interestId, builderId });
  
  return interest;
};

/**
 * Get builder's interests
 * 
 * @param {string} builderId - Builder's user ID
 * @param {Object} [options={}] - Query options
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Promise<Object>} Paginated interests
 */
const getBuilderInterests = async (builderId, options = {}) => {
  const { status, page = 1, limit = 20 } = options;
  
  const query = { builder: builderId };
  
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  
  const [interests, total] = await Promise.all([
    Interest.find(query)
      .populate({
        path: 'opening',
        select: 'title roleType description equityRange cashRange status',
        populate: {
          path: 'founderProfile',
          select: 'startupName startupStage',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Interest.countDocuments(query),
  ]);
  
  return {
    interests,
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
// FOUNDER ACTIONS
// ============================================

/**
 * Shortlist a builder (Founder action - creates mutual match)
 * 
 * @param {string} founderId - Founder's user ID
 * @param {string} interestId - Interest ID
 * @returns {Promise<Object>} Updated interest with match status
 */
const shortlistBuilder = async (founderId, interestId) => {
  const interest = await Interest.findById(interestId)
    .populate('opening')
    .populate('builderProfile');
  
  if (!interest) {
    throw ApiError.notFound('Interest not found');
  }
  
  // Verify founder owns the opening
  if (interest.founder.toString() !== founderId.toString()) {
    throw ApiError.forbidden('You can only shortlist builders for your own openings');
  }
  
  if (interest.status !== INTEREST_STATUS.INTERESTED) {
    throw ApiError.badRequest(`Cannot shortlist - interest is ${interest.status}`);
  }
  
  // Update interest to shortlisted (this creates a mutual match)
  interest.status = INTEREST_STATUS.SHORTLISTED;
  interest.shortlistedAt = new Date();
  interest.isMutualMatch = true;
  interest.matchedAt = new Date();
  await interest.save();
  
  // Update builder profile shortlist count
  if (interest.builderProfile) {
    await interest.builderProfile.incrementShortlists();
    await interest.builderProfile.incrementMatches();
  }
  
  // Update founder profile match count
  const founderProfile = await FounderProfile.findOne({ user: founderId });
  if (founderProfile) {
    await founderProfile.incrementMatches();
  }

  // ============================================
  // REAL-TIME NOTIFICATIONS
  // ============================================

  // Get founder info for notification
  const founder = await User.findById(founderId).select('name avatarUrl');

  // Notify builder via socket
  socketService.emitBuilderShortlisted(interest.builder.toString(), {
    interestId,
    founderId,
    founderName: founder?.name || 'A founder',
    openingId: interest.opening._id,
    openingTitle: interest.opening.title,
  });

  // Create notification for builder
  try {
    await notificationService.notifyShortlisted({
      builderId: interest.builder,
      founder: { _id: founderId, name: founder?.name, avatarUrl: founder?.avatarUrl },
      opening: { _id: interest.opening._id, title: interest.opening.title },
      interestId,
    });
  } catch (notifError) {
    logger.warn('Failed to create shortlist notification', { error: notifError.message });
  }

  logger.info('Builder shortlisted - mutual match created', {
    interestId,
    founderId,
    builderId: interest.builder,
  });

  return interest;
};

/**
 * Pass on a builder (Founder action - reject)
 * 
 * @param {string} founderId - Founder's user ID
 * @param {string} interestId - Interest ID
 * @returns {Promise<Object>} Updated interest
 */
const passOnBuilder = async (founderId, interestId) => {
    const interest = await Interest.findById(interestId);
    
    if (!interest) {
      throw ApiError.notFound('Interest not found');
    }
    
    if (interest.founder.toString() !== founderId.toString()) {
      throw ApiError.forbidden('You can only pass on builders for your own openings');
    }
    
    if (interest.status !== INTEREST_STATUS.INTERESTED) {
      throw ApiError.badRequest(`Cannot pass - interest is ${interest.status}`);
    }
    
    interest.status = INTEREST_STATUS.PASSED;
    interest.passedAt = new Date();
    await interest.save();
    
    logger.info('Founder passed on builder', { interestId, founderId });
    
    return interest;
  };

/**
 * Get interests for founder's openings
 * 
 * @param {string} founderId - Founder's user ID
 * @param {Object} [options={}] - Query options
 * @param {string} [options.openingId] - Filter by specific opening
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Promise<Object>} Paginated interests
 */
const getFounderInterests = async (founderId, options = {}) => {
  const { openingId, status, page = 1, limit = 20 } = options;
  
  const query = { founder: founderId };
  
  if (openingId) {
    query.opening = openingId;
  }
  
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  
  const [interests, total] = await Promise.all([
    Interest.find(query)
      .populate('builder', 'name email avatarUrl')
      .populate('builderProfile', 'displayName skills riskAppetite hoursPerWeek intentStatement')
      .populate('opening', 'title roleType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Interest.countDocuments(query),
  ]);
  
  return {
    interests,
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
 * Get pending interests count for founder
 * 
 * @param {string} founderId - Founder's user ID
 * @returns {Promise<number>} Count of pending interests
 */
const getPendingInterestsCount = async (founderId) => {
  return Interest.countDocuments({
    founder: founderId,
    status: INTEREST_STATUS.INTERESTED,
  });
};

// ============================================
// MUTUAL MATCHES
// ============================================

/**
 * Get mutual matches for a user
 * 
 * @param {string} userId - User ID (founder or builder)
 * @param {Object} [options={}] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Promise<Object>} Paginated matches
 */
const getMutualMatches = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  const query = {
    isMutualMatch: true,
  };
  
  // Filter based on user type
  if (user.userType === USER_TYPES.FOUNDER) {
    query.founder = userId;
  } else if (user.userType === USER_TYPES.BUILDER) {
    query.builder = userId;
  }
  
  const skip = (page - 1) * limit;
  
  const [matches, total] = await Promise.all([
    Interest.find(query)
      .populate('builder', 'name email avatarUrl')
      .populate('founder', 'name email avatarUrl')
      .populate('builderProfile', 'displayName skills riskAppetite hoursPerWeek')
      .populate({
        path: 'opening',
        select: 'title roleType',
        populate: {
          path: 'founderProfile',
          select: 'startupName startupStage',
        },
      })
      .populate('conversation', '_id')
      .sort({ matchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Interest.countDocuments(query),
  ]);
  
  return {
    matches,
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
 * Check if two users have a mutual match
 * 
 * @param {string} founderId - Founder's user ID
 * @param {string} builderId - Builder's user ID
 * @returns {Promise<Object|null>} Match interest or null
 */
const checkMutualMatch = async (founderId, builderId) => {
  return Interest.findOne({
    founder: founderId,
    builder: builderId,
    isMutualMatch: true,
  });
};

/**
 * Get match by ID
 * 
 * @param {string} interestId - Interest/Match ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Match details
 */
const getMatchById = async (interestId, userId) => {
  const interest = await Interest.findById(interestId)
    .populate('builder', 'name email avatarUrl')
    .populate('founder', 'name email avatarUrl')
    .populate('builderProfile')
    .populate({
      path: 'opening',
      populate: {
        path: 'founderProfile',
      },
    })
    .populate('conversation');
  
  if (!interest) {
    throw ApiError.notFound('Match not found');
  }
  
  // Verify user is part of this match
  const isFounder = interest.founder._id.toString() === userId.toString();
  const isBuilder = interest.builder._id.toString() === userId.toString();
  
  if (!isFounder && !isBuilder) {
    throw ApiError.forbidden('You are not part of this match');
  }
  
  return interest;
};

// ============================================
// LINK CONVERSATION TO MATCH
// ============================================

/**
 * Link a conversation to a match
 * 
 * @param {string} interestId - Interest/Match ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Updated interest
 */
const linkConversation = async (interestId, conversationId) => {
  const interest = await Interest.findByIdAndUpdate(
    interestId,
    { conversation: conversationId },
    { new: true }
  );
  
  if (!interest) {
    throw ApiError.notFound('Match not found');
  }
  
  logger.info('Conversation linked to match', { interestId, conversationId });
  
  return interest;
};

// ============================================
// ANALYTICS
// ============================================

/**
 * Get interest statistics for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Interest statistics
 */
const getInterestStats = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (user.userType === USER_TYPES.BUILDER) {
    const stats = await Interest.aggregate([
      { $match: { builder: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const result = {
      total: 0,
      interested: 0,
      shortlisted: 0,
      passed: 0,
      withdrawn: 0,
      mutualMatches: 0,
    };
    
    stats.forEach(stat => {
      const key = stat._id.toLowerCase();
      result[key] = stat.count;
      result.total += stat.count;
    });
    
    // Get mutual matches count
    result.mutualMatches = await Interest.countDocuments({
      builder: userId,
      isMutualMatch: true,
    });
    
    return result;
  } else if (user.userType === USER_TYPES.FOUNDER) {
    const stats = await Interest.aggregate([
      { $match: { founder: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const result = {
      totalReceived: 0,
      pending: 0,
      shortlisted: 0,
      passed: 0,
      mutualMatches: 0,
    };
    
    stats.forEach(stat => {
      if (stat._id === INTEREST_STATUS.INTERESTED) {
        result.pending = stat.count;
      } else if (stat._id === INTEREST_STATUS.SHORTLISTED) {
        result.shortlisted = stat.count;
      } else if (stat._id === INTEREST_STATUS.PASSED) {
        result.passed = stat.count;
      }
      result.totalReceived += stat.count;
    });
    
    result.mutualMatches = result.shortlisted;
    
    return result;
  }
  
  throw ApiError.badRequest('Invalid user type');
};

/**
 * Get today's interest count for builder
 * 
 * @param {string} builderId - Builder's user ID
 * @returns {Promise<Object>} Today's count and limit
 */
const getTodayInterestCount = async (builderId) => {
  const user = await User.findById(builderId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const count = await Interest.countDocuments({
    builder: builderId,
    createdAt: { $gte: todayStart },
  });
  
  const limit = DAILY_INTEREST_LIMITS[user.subscriptionTier] || DAILY_INTEREST_LIMITS[SUBSCRIPTION_TIERS.FREE];
  
  return {
    used: count,
    limit,
    remaining: Math.max(0, limit - count),
  };
};

// ============================================
// CHECK INTEREST BY OPENING
// ============================================

/**
 * Check if builder has already expressed interest in an opening
 *
 * @param {string} builderId - Builder's user ID
 * @param {string} openingId - Opening ID
 * @returns {Promise<Object>} Interest status and details
 */
const checkInterestByOpening = async (builderId, openingId) => {
  const interest = await Interest.findOne({
    builder: builderId,
    opening: openingId,
  }).lean();

  return {
    hasInterest: !!interest,
    interest: interest || null,
    status: interest?.status || null,
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Builder actions
  expressInterest,
  withdrawInterest,
  getBuilderInterests,
  checkInterestByOpening,

  // Founder actions
  shortlistBuilder,
  passOnBuilder,
  getFounderInterests,
  getPendingInterestsCount,

  // Mutual matches
  getMutualMatches,
  checkMutualMatch,
  getMatchById,
  linkConversation,

  // Analytics
  getInterestStats,
  getTodayInterestCount,

  // Constants
  DAILY_INTEREST_LIMITS,
};
