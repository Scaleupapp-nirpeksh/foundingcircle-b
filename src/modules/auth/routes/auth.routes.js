/**
 * @fileoverview Authentication Routes
 *
 * Defines all authentication-related API endpoints.
 * Uses phone number (SMS OTP) for authentication.
 *
 * @module routes/auth
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { auth, rateLimit } = require('../../../shared/middleware/auth');

// ============================================
// RATE LIMITERS
// ============================================

// OTP request rate limit: 5 requests per 15 minutes per IP
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
});

// Login rate limit: 10 attempts per 15 minutes per IP
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
});

// Token refresh rate limit: 30 requests per 15 minutes per IP
const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
});

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   POST /api/v1/auth/otp/request
 * @desc    Request OTP for login/registration (sent via SMS)
 * @access  Public
 * @body    { phone: string, purpose?: 'login' | 'register' | 'reset' }
 * @example { "phone": "+919876543210" } or { "phone": "9876543210" }
 */
router.post('/otp/request', otpRateLimit, authController.requestOTP);

/**
 * @route   POST /api/v1/auth/otp/verify
 * @desc    Verify OTP and login/register user
 * @access  Public
 * @body    { phone: string, otp: string, userType?: 'FOUNDER' | 'BUILDER' }
 * @example { "phone": "+919876543210", "otp": "123456" }
 */
router.post('/otp/verify', loginRateLimit, authController.verifyOTPAndLogin);

/**
 * @route   POST /api/v1/auth/token/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token)
 * @body    { refreshToken: string }
 */
router.post('/token/refresh', refreshRateLimit, authController.refreshToken);

/**
 * @route   POST /api/v1/auth/check-phone
 * @desc    Check if phone number exists in the system
 * @access  Public
 * @body    { phone: string }
 * @example { "phone": "+919876543210" }
 */
router.post('/check-phone', authController.checkPhone);

// ============================================
// PROTECTED ROUTES
// ============================================

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', auth, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth, authController.logout);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
