/**
 * @fileoverview Authentication Controller
 *
 * Handles all authentication-related HTTP endpoints:
 * - OTP request and verification
 * - Login/Registration via OTP
 * - Token refresh
 * - Logout
 * - Email existence check
 *
 * @module controllers/auth
 */

const authService = require('../services/auth.service');
const { ApiResponse, asyncHandler } = require('../utils');

// ============================================
// OTP ENDPOINTS
// ============================================

/**
 * Request OTP for login/registration
 *
 * @route POST /api/v1/auth/otp/request
 * @access Public
 *
 * @param {Object} req.body
 * @param {string} req.body.email - User email address
 * @param {string} [req.body.purpose='login'] - OTP purpose (login, register, reset)
 *
 * @returns {Object} OTP sent confirmation with expiry info
 */
const requestOTP = asyncHandler(async (req, res) => {
  const { email, purpose = 'login' } = req.body;

  const result = await authService.sendOTP(email, purpose);

  return ApiResponse.otpSent({
    email: result.email,
    expiresIn: result.expiresIn,
    purpose: result.purpose,
    // Include OTP in development for testing
    ...(result.otp && { otp: result.otp }),
  }).send(res);
});

/**
 * Verify OTP and login/register user
 *
 * @route POST /api/v1/auth/otp/verify
 * @access Public
 *
 * @param {Object} req.body
 * @param {string} req.body.email - User email address
 * @param {string} req.body.otp - OTP code to verify
 * @param {string} [req.body.userType] - User type (required for new users)
 *
 * @returns {Object} User data and authentication tokens
 */
const verifyOTPAndLogin = asyncHandler(async (req, res) => {
  const { email, otp, userType } = req.body;

  const result = await authService.loginWithOTP(email, otp, userType);

  // Choose appropriate response based on whether user is new
  if (result.user.isNewUser) {
    return ApiResponse.registerSuccess({
      user: result.user,
      tokens: result.tokens,
    }, 'Registration successful').send(res);
  }

  return ApiResponse.loginSuccess({
    user: result.user,
    tokens: result.tokens,
  }).send(res);
});

// ============================================
// TOKEN ENDPOINTS
// ============================================

/**
 * Refresh access token using refresh token
 *
 * @route POST /api/v1/auth/token/refresh
 * @access Public (requires valid refresh token)
 *
 * @param {Object} req.body
 * @param {string} req.body.refreshToken - Valid refresh token
 *
 * @returns {Object} New access and refresh tokens
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  return ApiResponse.tokenRefreshed({
    user: result.user,
    tokens: result.tokens,
  }).send(res);
});

// ============================================
// SESSION ENDPOINTS
// ============================================

/**
 * Logout user
 *
 * @route POST /api/v1/auth/logout
 * @access Private (requires authentication)
 *
 * @param {Object} req.user - Authenticated user from middleware
 *
 * @returns {Object} Logout confirmation
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const token = req.headers.authorization?.split(' ')[1];

  await authService.logout(userId, token);

  return ApiResponse.logoutSuccess().send(res);
});

/**
 * Get current authenticated user
 *
 * @route GET /api/v1/auth/me
 * @access Private (requires authentication)
 *
 * @param {Object} req.user - Authenticated user from middleware
 *
 * @returns {Object} Current user data
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId, email, userType } = req.user;

  return ApiResponse.ok('User retrieved successfully', {
    user: {
      id: userId,
      email,
      userType,
    },
  }).send(res);
});

// ============================================
// UTILITY ENDPOINTS
// ============================================

/**
 * Check if email exists in the system
 *
 * @route POST /api/v1/auth/check-email
 * @access Public
 *
 * @param {Object} req.body
 * @param {string} req.body.email - Email to check
 *
 * @returns {Object} Email existence status and user type if exists
 */
const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.checkEmailExists(email);

  return ApiResponse.ok('Email check completed', result).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  requestOTP,
  verifyOTPAndLogin,
  refreshToken,
  logout,
  getCurrentUser,
  checkEmail,
};
