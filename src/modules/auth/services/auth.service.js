/**
 * @fileoverview Authentication Service
 *
 * Handles all authentication-related business logic:
 * - OTP generation and verification (via SMS)
 * - Token generation and refresh
 * - User session management
 *
 * @module services/auth
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { config } = require('../../../shared/config');
const { User } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const { USER_STATUS } = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');
const TwilioService = require('./twilio.service');

// ============================================
// OTP STORAGE (In-Memory for MVP)
// For production, use Redis
// ============================================

const otpStore = new Map();

/**
 * OTP Record Structure
 * @typedef {Object} OTPRecord
 * @property {string} otp - The OTP code
 * @property {string} phone - User phone
 * @property {Date} expiresAt - Expiration time
 * @property {number} attempts - Verification attempts
 * @property {Date} [cooldownUntil] - Cooldown end time
 */

// ============================================
// OTP FUNCTIONS
// ============================================

/**
 * Generate a random numeric OTP
 * @param {number} [length=6] - OTP length
 * @returns {string} Generated OTP
 */
const generateOTP = (length = config.otp.length) => {
  const digits = '0123456789';
  let otp = '';

  // Use crypto for better randomness
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }

  return otp;
};

/**
 * Get OTP storage key
 * @param {string} phone - User phone
 * @param {string} purpose - OTP purpose (login, register, reset)
 * @returns {string} Storage key
 */
const getOTPKey = (phone, purpose = 'login') => {
  return `${phone}:${purpose}`;
};

/**
 * Send OTP to user's phone via SMS
 *
 * @param {string} phone - User phone number (will be formatted to E.164)
 * @param {string} [purpose='login'] - Purpose of OTP
 * @returns {Promise<Object>} OTP details (without actual OTP in production)
 *
 * @throws {ApiError} If user is in cooldown or banned
 */
const sendOTP = async (phone, purpose = 'login') => {
  // Format phone to E.164
  const formattedPhone = TwilioService.formatPhoneNumber(phone);

  // Validate phone format
  if (!TwilioService.validatePhoneNumber(formattedPhone)) {
    throw ApiError.badRequest('Invalid phone number format. Please use format: +919876543210');
  }

  const key = getOTPKey(formattedPhone, purpose);

  // Check if user exists and is not banned (for login)
  if (purpose === 'login') {
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      if (existingUser.status === USER_STATUS.BANNED) {
        throw ApiError.forbidden('This account has been banned');
      }
      if (existingUser.status === USER_STATUS.SUSPENDED) {
        throw ApiError.forbidden('This account has been suspended');
      }
    }
  }

  // Check cooldown
  const existingRecord = otpStore.get(key);
  if (existingRecord?.cooldownUntil && new Date() < existingRecord.cooldownUntil) {
    const remainingSeconds = Math.ceil((existingRecord.cooldownUntil - new Date()) / 1000);
    throw ApiError.tooManyRequests(
      `Too many attempts. Please try again in ${remainingSeconds} seconds`
    );
  }

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  // Store OTP
  const otpRecord = {
    otp,
    phone: formattedPhone,
    purpose,
    expiresAt,
    attempts: 0,
    createdAt: new Date(),
  };

  otpStore.set(key, otpRecord);

  // Send OTP via SMS
  if (config.env === 'development') {
    // In development, log the OTP instead of sending SMS
    logger.info(`📱 OTP for ${formattedPhone}: ${otp}`);
    console.log(`\n📱 ========== OTP ==========`);
    console.log(`   Phone: ${formattedPhone}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Expires: ${config.otp.expiryMinutes} minutes`);
    console.log(`==============================\n`);
  } else {
    // In production, send via Twilio
    await TwilioService.sendOTP(formattedPhone, otp);
  }

  logger.logAuth('OTP_SENT', {
    phone: formattedPhone,
    purpose,
    expiresIn: config.otp.expiryMinutes,
  });

  return {
    phone: formattedPhone,
    expiresIn: config.otp.expiryMinutes * 60, // in seconds
    purpose,
    // Only include OTP in development for testing
    ...(config.env === 'development' && { otp }),
  };
};

/**
 * Verify OTP
 *
 * @param {string} phone - User phone
 * @param {string} otp - OTP to verify
 * @param {string} [purpose='login'] - Purpose of OTP
 * @returns {Promise<boolean>} True if OTP is valid
 *
 * @throws {ApiError} If OTP is invalid, expired, or max attempts exceeded
 */
const verifyOTP = async (phone, otp, purpose = 'login') => {
  const formattedPhone = TwilioService.formatPhoneNumber(phone);
  const key = getOTPKey(formattedPhone, purpose);
  const record = otpStore.get(key);

  // Check if OTP exists
  if (!record) {
    throw ApiError.badRequest('No OTP found. Please request a new one.');
  }

  // Check cooldown
  if (record.cooldownUntil && new Date() < record.cooldownUntil) {
    const remainingSeconds = Math.ceil((record.cooldownUntil - new Date()) / 1000);
    throw ApiError.tooManyRequests(
      `Too many attempts. Please try again in ${remainingSeconds} seconds`
    );
  }

  // Check expiry
  if (new Date() > record.expiresAt) {
    otpStore.delete(key);
    throw ApiError.badRequest('OTP has expired. Please request a new one.');
  }

  // Check attempts
  if (record.attempts >= config.otp.maxAttempts) {
    // Set cooldown
    record.cooldownUntil = new Date(Date.now() + config.otp.cooldownMinutes * 60 * 1000);
    otpStore.set(key, record);

    throw ApiError.tooManyRequests(
      `Maximum attempts exceeded. Please try again in ${config.otp.cooldownMinutes} minutes`
    );
  }

  // Verify OTP
  if (record.otp !== otp) {
    record.attempts += 1;
    otpStore.set(key, record);

    const remainingAttempts = config.otp.maxAttempts - record.attempts;
    throw ApiError.badRequest(
      `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
    );
  }

  // OTP is valid - clear it
  otpStore.delete(key);

  logger.logAuth('OTP_VERIFIED', { phone: formattedPhone, purpose });

  return true;
};

// ============================================
// TOKEN FUNCTIONS
// ============================================

/**
 * Generate access and refresh tokens
 *
 * @param {Object} user - User document
 * @returns {Object} Tokens object
 * @returns {string} tokens.accessToken - JWT access token
 * @returns {string} tokens.refreshToken - JWT refresh token
 * @returns {Date} tokens.accessTokenExpires - Access token expiry
 * @returns {Date} tokens.refreshTokenExpires - Refresh token expiry
 */
const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    userType: user.userType,
    phone: user.phone,
  };

  // Generate access token
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });

  // Generate refresh token
  const refreshToken = jwt.sign(
    { userId: user._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  // Calculate expiry times
  const accessTokenExpires = new Date(
    Date.now() + parseExpiry(config.jwt.accessExpiresIn)
  );
  const refreshTokenExpires = new Date(
    Date.now() + parseExpiry(config.jwt.refreshExpiresIn)
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpires,
    refreshTokenExpires,
  };
};

/**
 * Parse expiry string to milliseconds
 * @param {string} expiry - Expiry string (e.g., '15m', '7d')
 * @returns {number} Milliseconds
 */
const parseExpiry = (expiry) => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || multipliers.m);
};

/**
 * Verify access token
 *
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }
};

/**
 * Verify refresh token
 *
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token has expired. Please login again.');
    }
    throw ApiError.unauthorized('Invalid refresh token');
  }
};

/**
 * Refresh access token using refresh token
 *
 * @param {string} refreshToken - JWT refresh token
 * @returns {Promise<Object>} New tokens and user
 * @throws {ApiError} If refresh token is invalid or user not found
 */
const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Find user
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Account is not active');
  }

  // Generate new tokens
  const tokens = generateTokens(user);

  logger.logAuth('TOKEN_REFRESHED', { userId: user._id });

  return {
    user: {
      id: user._id,
      phone: user.phone,
      userType: user.userType,
    },
    tokens,
  };
};

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Login or register user with OTP
 *
 * @param {string} phone - User phone
 * @param {string} otp - OTP code
 * @param {string} [userType] - User type (for registration)
 * @returns {Promise<Object>} User and tokens
 */
const loginWithOTP = async (phone, otp, userType = null) => {
  const formattedPhone = TwilioService.formatPhoneNumber(phone);

  // Verify OTP first
  await verifyOTP(formattedPhone, otp, 'login');

  // Find or create user
  let user = await User.findOne({ phone: formattedPhone });
  let isNewUser = false;

  if (!user) {
    // Registration - userType is required for new users
    // Default to null, will be set during onboarding
    user = await User.create({
      phone: formattedPhone,
      userType: userType || null,
      isPhoneVerified: true, // Verified via OTP
      status: USER_STATUS.ACTIVE,
      lastLoginAt: new Date(),
    });

    isNewUser = true;
    logger.logAuth('USER_REGISTERED', { userId: user._id, phone: formattedPhone, userType });
  } else {
    // Existing user - update last login
    user.lastLoginAt = new Date();
    user.isPhoneVerified = true;
    await user.save();

    logger.logAuth('USER_LOGIN', { userId: user._id, phone: formattedPhone });
  }

  // Generate tokens
  const tokens = generateTokens(user);

  return {
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email,
      userType: user.userType,
      name: user.name,
      isNewUser,
      onboardingComplete: user.onboardingComplete,
      hasFounderProfile: !!user.founderProfile,
      hasBuilderProfile: !!user.builderProfile,
      activeRole: user.activeRole,
    },
    tokens,
  };
};

/**
 * Logout user (invalidate tokens if using blacklist)
 * For MVP, just log the event. Token invalidation handled client-side.
 *
 * @param {string} userId - User ID
 * @param {string} [token] - Token to invalidate (for future blacklist)
 * @returns {Promise<boolean>} Success
 */
const logout = async (userId, token = null) => {
  // TODO: Add token to blacklist (Redis) for production

  logger.logAuth('USER_LOGOUT', { userId });

  return true;
};

/**
 * Check if phone exists
 *
 * @param {string} phone - Phone to check
 * @returns {Promise<Object>} Existence status and user type if exists
 */
const checkPhoneExists = async (phone) => {
  const formattedPhone = TwilioService.formatPhoneNumber(phone);
  const user = await User.findOne({ phone: formattedPhone }).select('userType status');

  if (!user) {
    return { exists: false };
  }

  if (user.status === USER_STATUS.BANNED) {
    throw ApiError.forbidden('This account has been banned');
  }

  return {
    exists: true,
    userType: user.userType,
    isSuspended: user.status === USER_STATUS.SUSPENDED,
  };
};

// ============================================
// CLEANUP (for development/testing)
// ============================================

/**
 * Clear expired OTPs from store
 * Call this periodically in production
 */
const cleanupExpiredOTPs = () => {
  const now = new Date();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // OTP functions
  sendOTP,
  verifyOTP,
  generateOTP,

  // Token functions
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,

  // Auth functions
  loginWithOTP,
  logout,
  checkPhoneExists,

  // Utilities
  cleanupExpiredOTPs,
};
