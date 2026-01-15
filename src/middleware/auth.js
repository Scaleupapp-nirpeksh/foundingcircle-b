/**
 * @fileoverview Authentication middleware
 * 
 * Handles JWT verification, route protection, and role-based access control.
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { User } = require('../models');
const { AppError, asyncHandler } = require('./errorHandler');
const { ERROR_CODES, USER_TYPES, USER_STATUS } = require('../constants');

// ============================================
// TOKEN UTILITIES
// ============================================

/**
 * Extract access token from request
 * Checks Authorization header (Bearer token) and cookies
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null if not found
 */
const extractToken = (req) => {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies as fallback
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Extract refresh token from request
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} Refresh token or null
 */
const extractRefreshToken = (req) => {
  // Check body first (for refresh endpoint)
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }

  // Check cookies as fallback
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }

  return null;
};

/**
 * Verify and decode access token
 * 
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {AppError} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Token has expired', ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }
    if (error.name === 'JsonWebTokenError') {
      throw AppError.unauthorized('Invalid token', ERROR_CODES.AUTH_TOKEN_INVALID);
    }
    throw AppError.unauthorized('Token verification failed', ERROR_CODES.AUTH_TOKEN_INVALID);
  }
};

/**
 * Verify and decode refresh token
 * 
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {AppError} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Refresh token has expired', ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }
    if (error.name === 'JsonWebTokenError') {
      throw AppError.unauthorized('Invalid refresh token', ERROR_CODES.AUTH_TOKEN_INVALID);
    }
    throw AppError.unauthorized('Refresh token verification failed', ERROR_CODES.AUTH_TOKEN_INVALID);
  }
};

/**
 * Generate access and refresh tokens for a user
 * 
 * @param {Object} user - User document
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    userType: user.userType,
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

// ============================================
// MAIN AUTH MIDDLEWARE
// ============================================

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * @example
 * // Protect a route
 * router.get('/profile', auth, (req, res) => {
 *   res.json(req.user);
 * });
 */
const auth = asyncHandler(async (req, res, next) => {
  // Extract token
  const token = extractToken(req);

  if (!token) {
    throw AppError.unauthorized(
      'Access denied. No token provided.',
      ERROR_CODES.AUTH_TOKEN_INVALID
    );
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  // Find user
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw AppError.unauthorized(
      'User not found or has been deleted',
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Check if user is active
  if (user.status !== USER_STATUS.ACTIVE) {
    if (user.status === USER_STATUS.SUSPENDED) {
      throw AppError.unauthorized(
        'Your account has been suspended',
        ERROR_CODES.AUTH_ACCOUNT_SUSPENDED
      );
    }
    if (user.status === USER_STATUS.BANNED) {
      throw AppError.unauthorized(
        'Your account has been banned',
        ERROR_CODES.AUTH_ACCOUNT_SUSPENDED
      );
    }
    throw AppError.unauthorized(
      'Your account is not active',
      ERROR_CODES.AUTH_ACCOUNT_SUSPENDED
    );
  }

  // Check if email is verified (if required)
  if (config.auth?.requireEmailVerification && !user.isEmailVerified) {
    throw AppError.unauthorized(
      'Please verify your email address',
      ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED
    );
  }

  // Attach user and token info to request
  req.user = user;
  req.userId = user._id;
  req.userType = user.userType;
  req.token = token;
  req.tokenPayload = decoded;

  next();
});

// ============================================
// OPTIONAL AUTH MIDDLEWARE
// ============================================

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if not
 * Useful for routes that behave differently for logged-in users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * @example
 * // Route works for everyone, but shows extra data for logged-in users
 * router.get('/openings', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // Show personalized results
 *   } else {
 *     // Show public results
 *   }
 * });
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.status === USER_STATUS.ACTIVE) {
      req.user = user;
      req.userId = user._id;
      req.userType = user.userType;
      req.token = token;
      req.tokenPayload = decoded;
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
    // Just proceed without user context
  }

  next();
});

// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================

/**
 * Restrict route to specific user types
 * Must be used after auth middleware
 * 
 * @param {...string} allowedTypes - Allowed user types
 * @returns {Function} Middleware function
 * 
 * @example
 * // Only founders can access
 * router.post('/openings', auth, requireRole(USER_TYPES.FOUNDER), createOpening);
 * 
 * // Multiple roles allowed
 * router.get('/dashboard', auth, requireRole(USER_TYPES.FOUNDER, USER_TYPES.ADMIN), getDashboard);
 */
const requireRole = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return next(
        AppError.forbidden(
          `Access denied. This route is for ${allowedTypes.join(' or ')} only.`
        )
      );
    }

    next();
  };
};

/**
 * Require founder role
 * Shorthand for requireRole(USER_TYPES.FOUNDER)
 */
const requireFounder = requireRole(USER_TYPES.FOUNDER);

/**
 * Require builder role
 * Shorthand for requireRole(USER_TYPES.BUILDER)
 */
const requireBuilder = requireRole(USER_TYPES.BUILDER);

/**
 * Require admin role
 * Shorthand for requireRole(USER_TYPES.ADMIN)
 */
const requireAdmin = requireRole(USER_TYPES.ADMIN);

// ============================================
// PROFILE COMPLETION CHECK
// ============================================

/**
 * Require completed profile
 * Must be used after auth middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * @example
 * router.get('/matches', auth, requireCompleteProfile, getMatches);
 */
const requireCompleteProfile = (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required'));
  }

  if (!req.user.onboardingComplete) {
    return next(
      AppError.forbidden(
        'Please complete your profile before accessing this feature',
        ERROR_CODES.USER_PROFILE_INCOMPLETE
      )
    );
  }

  next();
};

// ============================================
// EMAIL VERIFICATION CHECK
// ============================================

/**
 * Require verified email
 * Must be used after auth middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required'));
  }

  if (!req.user.isEmailVerified) {
    return next(
      AppError.forbidden(
        'Please verify your email address to access this feature',
        ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED
      )
    );
  }

  next();
};

// ============================================
// RESOURCE OWNERSHIP CHECK
// ============================================

/**
 * Create middleware to check resource ownership
 * Verifies the current user owns the requested resource
 * 
 * @param {Function} getResourceUserId - Function to extract owner ID from request
 * @returns {Function} Middleware function
 * 
 * @example
 * // Check if user owns the profile they're updating
 * const isProfileOwner = requireOwnership((req) => req.params.userId);
 * router.put('/profile/:userId', auth, isProfileOwner, updateProfile);
 * 
 * // For resources with a 'user' field
 * const isOpeningOwner = requireOwnership(async (req) => {
 *   const opening = await Opening.findById(req.params.id);
 *   return opening?.founder;
 * });
 */
const requireOwnership = (getResourceUserId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    // Admin can access anything
    if (req.user.userType === USER_TYPES.ADMIN) {
      return next();
    }

    const resourceUserId = await getResourceUserId(req);

    if (!resourceUserId) {
      return next(AppError.notFound('Resource not found'));
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return next(AppError.forbidden('You do not have permission to access this resource'));
    }

    next();
  });
};

// ============================================
// RATE LIMITING HELPER
// ============================================

/**
 * Simple in-memory rate limiter for sensitive routes
 * For production, use Redis-based rate limiting
 */
const rateLimitStore = new Map();

/**
 * Create rate limiting middleware
 * 
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {string} [options.keyGenerator] - Function to generate rate limit key
 * @returns {Function} Middleware function
 * 
 * @example
 * // Limit login attempts to 5 per 15 minutes
 * router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), login);
 */
const rateLimit = (options) => {
  const { windowMs = 60000, max = 100, keyGenerator } = options;

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (now - data.startTime > windowMs) {
        rateLimitStore.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    // Generate key based on IP and optional custom generator
    const key = keyGenerator
      ? keyGenerator(req)
      : `${req.ip}:${req.path}`;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create rate limit data
    let data = rateLimitStore.get(key);

    if (!data || data.startTime < windowStart) {
      data = { count: 0, startTime: now };
    }

    data.count++;
    rateLimitStore.set(key, data);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - data.count));
    res.set('X-RateLimit-Reset', new Date(data.startTime + windowMs).toISOString());

    if (data.count > max) {
      return next(AppError.tooManyRequests(
        `Too many requests. Please try again in ${Math.ceil((data.startTime + windowMs - now) / 1000)} seconds.`
      ));
    }

    next();
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Token utilities
  extractToken,
  extractRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
  
  // Main auth middleware
  auth,
  optionalAuth,
  
  // Role-based access
  requireRole,
  requireFounder,
  requireBuilder,
  requireAdmin,
  
  // Additional checks
  requireCompleteProfile,
  requireVerifiedEmail,
  requireOwnership,
  
  // Rate limiting
  rateLimit,
};