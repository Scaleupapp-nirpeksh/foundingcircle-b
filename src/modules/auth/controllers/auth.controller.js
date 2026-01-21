/**
 * @fileoverview Authentication Controller
 *
 * Handles all authentication-related HTTP endpoints:
 * - OTP request and verification (via SMS)
 * - Login/Registration via OTP
 * - Token refresh
 * - Logout
 * - Phone existence check
 *
 * @module controllers/auth
 */

const authService = require('../services/auth.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

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
 * @param {string} req.body.phone - User phone number (e.g., +919876543210 or 9876543210)
 * @param {string} [req.body.purpose='login'] - OTP purpose (login, register, reset)
 *
 * @returns {Object} OTP sent confirmation with expiry info
 */
const requestOTP = asyncHandler(async (req, res) => {
  const { phone, purpose = 'login' } = req.body;

  const result = await authService.sendOTP(phone, purpose);

  return ApiResponse.otpSent({
    phone: result.phone,
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
 * @param {string} req.body.phone - User phone number
 * @param {string} req.body.otp - OTP code to verify
 * @param {string} [req.body.userType] - User type (optional, can be set during onboarding)
 *
 * @returns {Object} User data and authentication tokens
 */
const verifyOTPAndLogin = asyncHandler(async (req, res) => {
  const { phone, otp, userType } = req.body;

  const result = await authService.loginWithOTP(phone, otp, userType);

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
  const { userId, phone, userType } = req.user;

  return ApiResponse.ok('User retrieved successfully', {
    user: {
      id: userId,
      phone,
      userType,
    },
  }).send(res);
});

// ============================================
// UTILITY ENDPOINTS
// ============================================

/**
 * Check if phone number exists in the system
 *
 * @route POST /api/v1/auth/check-phone
 * @access Public
 *
 * @param {Object} req.body
 * @param {string} req.body.phone - Phone number to check
 *
 * @returns {Object} Phone existence status and user type if exists
 */
const checkPhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const result = await authService.checkPhoneExists(phone);

  return ApiResponse.ok('Phone check completed', result).send(res);
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
  checkPhone,
};
