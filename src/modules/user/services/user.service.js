/**
 * @fileoverview User Service
 * 
 * Handles user-related business logic:
 * - User retrieval (by ID, email)
 * - User updates
 * - User deletion/deactivation
 * - Profile association
 * 
 * @module services/user
 */

const { User, FounderProfile, BuilderProfile } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const { USER_STATUS, USER_TYPES } = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');

// ============================================
// USER RETRIEVAL
// ============================================

/**
 * Get user by ID
 * 
 * @param {string} userId - User ID
 * @param {Object} [options={}] - Query options
 * @param {boolean} [options.includeProfile=false] - Include associated profile
 * @param {string} [options.select] - Fields to select
 * @returns {Promise<Object>} User document
 * @throws {ApiError} If user not found
 */
const getUserById = async (userId, options = {}) => {
  const { includeProfile = false, select = '' } = options;
  
  const user = await User.findById(userId).select(select);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  if (includeProfile) {
    const profile = await getUserProfile(user);
    return { ...user.toObject(), profile };
  }
  
  return user;
};

/**
 * Get user by email
 * 
 * @param {string} email - User email
 * @param {Object} [options={}] - Query options
 * @param {boolean} [options.includeProfile=false] - Include associated profile
 * @returns {Promise<Object|null>} User document or null
 */
const getUserByEmail = async (email, options = {}) => {
  const { includeProfile = false } = options;
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await User.findOne({ email: normalizedEmail });
  
  if (!user) {
    return null;
  }
  
  if (includeProfile) {
    const profile = await getUserProfile(user);
    return { ...user.toObject(), profile };
  }
  
  return user;
};

/**
 * Get user's associated profile (Founder or Builder)
 * 
 * @param {Object} user - User document
 * @returns {Promise<Object|null>} Profile document or null
 */
const getUserProfile = async (user) => {
  if (user.userType === USER_TYPES.FOUNDER) {
    return FounderProfile.findOne({ user: user._id });
  }
  
  if (user.userType === USER_TYPES.BUILDER) {
    return BuilderProfile.findOne({ user: user._id });
  }
  
  return null;
};

/**
 * Get user with full profile data
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User with profile
 * @throws {ApiError} If user not found
 */
const getUserWithProfile = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  const profile = await getUserProfile(user);
  
  return {
    user: user.toObject(),
    profile: profile ? profile.toObject() : null,
    profileComplete: user.onboardingComplete,
  };
};

// ============================================
// USER UPDATES
// ============================================

/**
 * Update user basic info
 * 
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.name] - User name
 * @param {string} [updateData.phone] - User phone
 * @param {string} [updateData.location] - User location
 * @param {string} [updateData.avatarUrl] - Profile picture URL
 * @returns {Promise<Object>} Updated user
 * @throws {ApiError} If user not found or validation fails
 */
const updateUser = async (userId, updateData) => {
  // Fields that can be updated
  const allowedFields = ['name', 'phone', 'location', 'avatarUrl', 'timezone'];
  
  // Filter to only allowed fields
  const filteredData = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});
  
  if (Object.keys(filteredData).length === 0) {
    throw ApiError.badRequest('No valid fields to update');
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: filteredData },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  logger.info('User updated', { userId, fields: Object.keys(filteredData) });
  
  return user;
};

/**
 * Update user's onboarding status
 * 
 * @param {string} userId - User ID
 * @param {boolean} complete - Onboarding complete status
 * @returns {Promise<Object>} Updated user
 */
const updateOnboardingStatus = async (userId, complete = true) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { 
      onboardingComplete: complete,
      onboardingCompletedAt: complete ? new Date() : null,
    },
    { new: true }
  );
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  logger.info('Onboarding status updated', { userId, complete });
  
  return user;
};

/**
 * Update user's last activity timestamp
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const updateLastActive = async (userId) => {
  await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
};

/**
 * Update user's scenario completion status
 * 
 * @param {string} userId - User ID
 * @param {boolean} complete - Scenario complete status
 * @returns {Promise<Object>} Updated user
 */
const updateScenarioStatus = async (userId, complete = true) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { scenarioComplete: complete },
    { new: true }
  );
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  return user;
};

// ============================================
// USER STATUS MANAGEMENT
// ============================================

/**
 * Change user status
 * 
 * @param {string} userId - User ID
 * @param {string} status - New status (ACTIVE, SUSPENDED, BANNED)
 * @param {string} [reason] - Reason for status change
 * @returns {Promise<Object>} Updated user
 * @throws {ApiError} If user not found or invalid status
 */
const changeUserStatus = async (userId, status, reason = null) => {
  if (!Object.values(USER_STATUS).includes(status)) {
    throw ApiError.badRequest(`Invalid status: ${status}`);
  }
  
  const updateData = { status };
  
  // Track suspension/ban reason and timestamp
  if (status === USER_STATUS.SUSPENDED || status === USER_STATUS.BANNED) {
    updateData.statusReason = reason;
    updateData.statusChangedAt = new Date();
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  );
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  logger.warn('User status changed', { userId, status, reason });
  
  return user;
};

/**
 * Suspend user
 * 
 * @param {string} userId - User ID
 * @param {string} [reason] - Suspension reason
 * @returns {Promise<Object>} Updated user
 */
const suspendUser = async (userId, reason = 'Suspended by admin') => {
  return changeUserStatus(userId, USER_STATUS.SUSPENDED, reason);
};

/**
 * Ban user
 * 
 * @param {string} userId - User ID
 * @param {string} [reason] - Ban reason
 * @returns {Promise<Object>} Updated user
 */
const banUser = async (userId, reason = 'Banned by admin') => {
  return changeUserStatus(userId, USER_STATUS.BANNED, reason);
};

/**
 * Reactivate user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
const reactivateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { 
      $set: { status: USER_STATUS.ACTIVE },
      $unset: { statusReason: 1, statusChangedAt: 1 }
    },
    { new: true }
  );
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  logger.info('User reactivated', { userId });
  
  return user;
};

// ============================================
// USER DELETION
// ============================================

/**
 * Soft delete user (mark as deleted)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
const softDeleteUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { 
      status: USER_STATUS.DELETED,
      deletedAt: new Date(),
    },
    { new: true }
  );
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  logger.warn('User soft deleted', { userId });
  
  return user;
};

/**
 * Hard delete user and associated data
 * Use with caution - permanently removes all user data
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion summary
 */
const hardDeleteUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw ApiError.userNotFound();
  }
  
  // Delete associated profile
  if (user.userType === USER_TYPES.FOUNDER) {
    await FounderProfile.deleteOne({ user: userId });
  } else if (user.userType === USER_TYPES.BUILDER) {
    await BuilderProfile.deleteOne({ user: userId });
  }
  
  // Delete user
  await User.deleteOne({ _id: userId });
  
  logger.warn('User hard deleted', { userId, email: user.email });
  
  return {
    deleted: true,
    userId,
    email: user.email,
  };
};

// ============================================
// USER QUERIES
// ============================================

/**
 * Get users with pagination and filters
 * 
 * @param {Object} [filters={}] - Query filters
 * @param {string} [filters.userType] - Filter by user type
 * @param {string} [filters.status] - Filter by status
 * @param {boolean} [filters.onboardingComplete] - Filter by onboarding status
 * @param {string} [filters.search] - Search by name or email
 * @param {Object} [options={}] - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.sort='-createdAt'] - Sort field
 * @returns {Promise<Object>} Paginated users
 */
const getUsers = async (filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = options;
  
  // Build query
  const query = {};
  
  if (filters.userType) {
    query.userType = filters.userType;
  }
  
  if (filters.status) {
    query.status = filters.status;
  } else {
    // By default, exclude deleted users
    query.status = { $ne: USER_STATUS.DELETED };
  }
  
  if (typeof filters.onboardingComplete === 'boolean') {
    query.onboardingComplete = filters.onboardingComplete;
  }
  
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
    ];
  }
  
  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);
  
  return {
    users,
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
 * Count users by type and status
 * 
 * @returns {Promise<Object>} User counts
 */
const getUserCounts = async () => {
  const [byType, byStatus, total] = await Promise.all([
    User.aggregate([
      { $match: { status: { $ne: USER_STATUS.DELETED } } },
      { $group: { _id: '$userType', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    User.countDocuments({ status: { $ne: USER_STATUS.DELETED } }),
  ]);
  
  return {
    total,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Retrieval
  getUserById,
  getUserByEmail,
  getUserProfile,
  getUserWithProfile,
  
  // Updates
  updateUser,
  updateOnboardingStatus,
  updateLastActive,
  updateScenarioStatus,
  
  // Status management
  changeUserStatus,
  suspendUser,
  banUser,
  reactivateUser,
  
  // Deletion
  softDeleteUser,
  hardDeleteUser,
  
  // Queries
  getUsers,
  getUserCounts,
};
