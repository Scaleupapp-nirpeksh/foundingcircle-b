/**
 * @fileoverview Middleware barrel file
 * 
 * Exports all middleware from a single location for cleaner imports.
 * 
 * @module middleware
 * 
 * @example
 * // Instead of:
 * const { auth } = require('./middleware/auth');
 * const { validate } = require('./middleware/validate');
 * const { errorHandler } = require('./middleware/errorHandler');
 * 
 * // You can do:
 * const { auth, validate, errorHandler } = require('./middleware');
 */

const {
    AppError,
    errorHandler,
    notFoundHandler,
    asyncHandler,
  } = require('./errorHandler');
  
  const {
    extractToken,
    extractRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokens,
    auth,
    optionalAuth,
    requireRole,
    requireFounder,
    requireBuilder,
    requireAdmin,
    requireCompleteProfile,
    requireVerifiedEmail,
    requireOwnership,
    rateLimit,
  } = require('./auth');
  
  const {
    validate,
    schemas,
    paginationSchema,
    idParamSchema,
    userIdParamSchema,
    validateData,
    sanitizeString,
    sanitizedString,
    requiredWhen,
    validateObjectId,
    validateEnum,
    validateEnumArray,
    Joi,
  } = require('./validate');
  
  module.exports = {
    // ============================================
    // ERROR HANDLING
    // ============================================
    
    /** Custom application error class */
    AppError,
    
    /** Global error handling middleware */
    errorHandler,
    
    /** 404 Not Found handler */
    notFoundHandler,
    
    /** Async route handler wrapper */
    asyncHandler,
  
    // ============================================
    // AUTHENTICATION
    // ============================================
    
    /** Extract token from request */
    extractToken,
    
    /** Extract refresh token from request */
    extractRefreshToken,
    
    /** Verify and decode access token */
    verifyAccessToken,
    
    /** Verify and decode refresh token */
    verifyRefreshToken,
    
    /** Generate access and refresh tokens */
    generateTokens,
    
    /** Authentication middleware - requires valid token */
    auth,
    
    /** Optional authentication - attaches user if token valid */
    optionalAuth,
    
    /** Role-based access control */
    requireRole,
    
    /** Require founder role */
    requireFounder,
    
    /** Require builder role */
    requireBuilder,
    
    /** Require admin role */
    requireAdmin,
    
    /** Require completed profile */
    requireCompleteProfile,
    
    /** Require verified email */
    requireVerifiedEmail,
    
    /** Require resource ownership */
    requireOwnership,
    
    /** Rate limiting middleware */
    rateLimit,
  
    // ============================================
    // VALIDATION
    // ============================================
    
    /** Request validation middleware factory */
    validate,
    
    /** Common validation schemas */
    schemas,
    
    /** Pagination query schema */
    paginationSchema,
    
    /** ID parameter schema */
    idParamSchema,
    
    /** User ID parameter schema */
    userIdParamSchema,
    
    /** Validate data against schema (non-middleware) */
    validateData,
    
    /** Sanitize string input */
    sanitizeString,
    
    /** Joi string with sanitization */
    sanitizedString,
    
    /** Conditional required field helper */
    requiredWhen,
    
    /** Custom ObjectId validator */
    validateObjectId,
    
    /** Enum validation helper */
    validateEnum,
    
    /** Enum array validation helper */
    validateEnumArray,
    
    /** Joi library (re-exported for convenience) */
    Joi,
  };