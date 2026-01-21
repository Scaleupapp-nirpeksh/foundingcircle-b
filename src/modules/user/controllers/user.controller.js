/**
 * @fileoverview User Controller
 *
 * Handles all user-related HTTP endpoints:
 * - Get user profile
 * - Update user info
 * - Delete/deactivate account
 * - Admin user management
 *
 * @module controllers/user
 */

const userService = require('../services/user.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// CURRENT USER ENDPOINTS
// ============================================

/**
 * Get current user's profile with associated data
 *
 * @route GET /api/v1/users/me
 * @access Private
 *
 * @returns {Object} User data with profile
 */
const getMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await userService.getUserWithProfile(userId);

  return ApiResponse.ok('User profile retrieved successfully', result).send(res);
});

/**
 * Update current user's basic info
 *
 * @route PATCH /api/v1/users/me
 * @access Private
 *
 * @param {Object} req.body
 * @param {string} [req.body.name] - User name
 * @param {string} [req.body.phone] - User phone
 * @param {string} [req.body.location] - User location
 * @param {string} [req.body.avatarUrl] - Profile picture URL
 * @param {string} [req.body.timezone] - User timezone
 *
 * @returns {Object} Updated user data
 */
const updateMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  const user = await userService.updateUser(userId, updateData);

  return ApiResponse.updated('Profile updated successfully', { user }).send(res);
});

/**
 * Delete current user's account (soft delete)
 *
 * @route DELETE /api/v1/users/me
 * @access Private
 *
 * @returns {Object} Deletion confirmation
 */
const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await userService.softDeleteUser(userId);

  return ApiResponse.ok('Account deleted successfully').send(res);
});

// ============================================
// USER RETRIEVAL ENDPOINTS
// ============================================

/**
 * Get user by ID
 *
 * @route GET /api/v1/users/:id
 * @access Private (Admin or self)
 *
 * @param {string} req.params.id - User ID
 * @param {boolean} [req.query.includeProfile] - Include associated profile
 *
 * @returns {Object} User data
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const includeProfile = req.query.includeProfile === 'true';

  const user = await userService.getUserById(id, { includeProfile });

  return ApiResponse.ok('User retrieved successfully', { user }).send(res);
});

/**
 * Get all users with pagination and filters
 *
 * @route GET /api/v1/users
 * @access Private (Admin only)
 *
 * @param {string} [req.query.userType] - Filter by user type
 * @param {string} [req.query.status] - Filter by status
 * @param {boolean} [req.query.onboardingComplete] - Filter by onboarding status
 * @param {string} [req.query.search] - Search by name or email
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 * @param {string} [req.query.sort=-createdAt] - Sort field
 *
 * @returns {Object} Paginated users list
 */
const getUsers = asyncHandler(async (req, res) => {
  const {
    userType,
    status,
    onboardingComplete,
    search,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  const filters = {};
  if (userType) filters.userType = userType;
  if (status) filters.status = status;
  if (onboardingComplete !== undefined) {
    filters.onboardingComplete = onboardingComplete === 'true';
  }
  if (search) filters.search = search;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
  };

  const result = await userService.getUsers(filters, options);

  return ApiResponse.paginated(
    result.users,
    result.pagination,
    'Users retrieved successfully'
  ).send(res);
});

/**
 * Get user statistics/counts
 *
 * @route GET /api/v1/users/stats
 * @access Private (Admin only)
 *
 * @returns {Object} User counts by type and status
 */
const getUserStats = asyncHandler(async (req, res) => {
  const counts = await userService.getUserCounts();

  return ApiResponse.ok('User statistics retrieved successfully', counts).send(res);
});

// ============================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ============================================

/**
 * Update user status (suspend, ban, reactivate)
 *
 * @route PATCH /api/v1/users/:id/status
 * @access Private (Admin only)
 *
 * @param {string} req.params.id - User ID
 * @param {Object} req.body
 * @param {string} req.body.status - New status (active, suspended, banned)
 * @param {string} [req.body.reason] - Reason for status change
 *
 * @returns {Object} Updated user data
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const user = await userService.changeUserStatus(id, status, reason);

  return ApiResponse.updated('User status updated successfully', { user }).send(res);
});

/**
 * Suspend a user
 *
 * @route POST /api/v1/users/:id/suspend
 * @access Private (Admin only)
 *
 * @param {string} req.params.id - User ID
 * @param {Object} req.body
 * @param {string} [req.body.reason] - Suspension reason
 *
 * @returns {Object} Updated user data
 */
const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await userService.suspendUser(id, reason);

  return ApiResponse.updated('User suspended successfully', { user }).send(res);
});

/**
 * Ban a user
 *
 * @route POST /api/v1/users/:id/ban
 * @access Private (Admin only)
 *
 * @param {string} req.params.id - User ID
 * @param {Object} req.body
 * @param {string} [req.body.reason] - Ban reason
 *
 * @returns {Object} Updated user data
 */
const banUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await userService.banUser(id, reason);

  return ApiResponse.updated('User banned successfully', { user }).send(res);
});

/**
 * Reactivate a suspended/banned user
 *
 * @route POST /api/v1/users/:id/reactivate
 * @access Private (Admin only)
 *
 * @param {string} req.params.id - User ID
 *
 * @returns {Object} Updated user data
 */
const reactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await userService.reactivateUser(id);

  return ApiResponse.updated('User reactivated successfully', { user }).send(res);
});

/**
 * Hard delete a user (permanent)
 *
 * @route DELETE /api/v1/users/:id
 * @access Private (Admin only)
 *
 * @param {string} req.params.id - User ID
 *
 * @returns {Object} Deletion confirmation
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await userService.hardDeleteUser(id);

  return ApiResponse.ok('User permanently deleted', result).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Current user
  getMe,
  updateMe,
  deleteMe,

  // User retrieval
  getUserById,
  getUsers,
  getUserStats,

  // Admin management
  updateUserStatus,
  suspendUser,
  banUser,
  reactivateUser,
  deleteUser,
};
