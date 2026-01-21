/**
 * @fileoverview Global error handling middleware
 * 
 * Catches all errors and returns consistent, formatted responses.
 * Handles different error types appropriately.
 * 
 * @module middleware/errorHandler
 */

const { ERROR_CODES } = require('../constants');

// ============================================
// CUSTOM ERROR CLASS
// ============================================

/**
 * Custom application error class
 * Use this to throw errors with specific status codes and error codes
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [errorCode] - Application error code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {string} [errorCode] - Error code
   * @param {Object} [details] - Details
   * @returns {AppError}
   */
  static badRequest(message, errorCode = ERROR_CODES.INVALID_INPUT, details = null) {
    return new AppError(message, 400, errorCode, details);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @param {string} [errorCode] - Error code
   * @returns {AppError}
   */
  static unauthorized(message = 'Unauthorized', errorCode = ERROR_CODES.AUTH_TOKEN_INVALID) {
    return new AppError(message, 401, errorCode);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @param {string} [errorCode] - Error code
   * @returns {AppError}
   */
  static forbidden(message = 'Forbidden', errorCode = null) {
    return new AppError(message, 403, errorCode);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} message - Error message
   * @param {string} [errorCode] - Error code
   * @returns {AppError}
   */
  static notFound(message = 'Resource not found', errorCode = null) {
    return new AppError(message, 404, errorCode);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {string} [errorCode] - Error code
   * @returns {AppError}
   */
  static conflict(message, errorCode = null) {
    return new AppError(message, 409, errorCode);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @param {Object} [details] - Validation details
   * @returns {AppError}
   */
  static validationError(message, details = null) {
    return new AppError(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }

  /**
   * Create a 429 Too Many Requests error
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new AppError(message, 429);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @param {string} [errorCode] - Error code
   * @returns {AppError}
   */
  static internal(message = 'Internal server error', errorCode = ERROR_CODES.INTERNAL_ERROR) {
    return new AppError(message, 500, errorCode);
  }
}

// ============================================
// ERROR RESPONSE FORMATTER
// ============================================

/**
 * Format error response object
 * @param {Error} err - The error
 * @param {boolean} isDev - Is development environment
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (err, isDev) => {
  const response = {
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred',
      code: err.errorCode || null,
    },
  };

  // Add details if present
  if (err.details) {
    response.error.details = err.details;
  }

  // Add stack trace in development
  if (isDev) {
    response.error.stack = err.stack;
  }

  return response;
};

// ============================================
// SPECIFIC ERROR HANDLERS
// ============================================

/**
 * Handle Mongoose CastError (invalid ObjectId)
 * @param {Error} err - CastError
 * @returns {AppError}
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return AppError.badRequest(message, ERROR_CODES.INVALID_INPUT);
};

/**
 * Handle Mongoose duplicate key error
 * @param {Error} err - Duplicate key error
 * @returns {AppError}
 */
const handleDuplicateKeyError = (err) => {
  // Extract the duplicate field name
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue ? err.keyValue[field] : 'unknown';
  const message = field 
    ? `${field} '${value}' already exists`
    : 'Duplicate value error';
  return AppError.conflict(message, ERROR_CODES.USER_ALREADY_EXISTS);
};

/**
 * Handle Mongoose validation error
 * @param {Error} err - ValidationError
 * @returns {AppError}
 */
const handleValidationError = (err) => {
  const details = {};
  
  // Extract validation errors for each field
  Object.keys(err.errors).forEach((field) => {
    const error = err.errors[field];
    details[field] = {
      message: error.message,
      value: error.value,
      kind: error.kind,
    };
  });

  const fields = Object.keys(details).join(', ');
  const message = `Validation failed for: ${fields}`;
  
  return AppError.validationError(message, details);
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @returns {AppError}
 */
const handleJWTError = (err) => {
  if (err.name === 'TokenExpiredError') {
    return AppError.unauthorized('Token has expired', ERROR_CODES.AUTH_TOKEN_EXPIRED);
  }
  return AppError.unauthorized('Invalid token', ERROR_CODES.AUTH_TOKEN_INVALID);
};

/**
 * Handle Mongoose connection errors
 * @param {Error} err - MongoDB error
 * @returns {AppError}
 */
const handleMongoError = (err) => {
  // Connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return AppError.internal('Database connection error', ERROR_CODES.DATABASE_ERROR);
  }
  return AppError.internal('Database error', ERROR_CODES.DATABASE_ERROR);
};

// ============================================
// MAIN ERROR HANDLER MIDDLEWARE
// ============================================

/**
 * Global error handling middleware
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal server error';

  const isDev = process.env.NODE_ENV === 'development';

  // Log error
  if (isDev) {
    console.error('🔴 Error:', {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    // In production, log less verbose
    console.error(`🔴 [${new Date().toISOString()}] ${err.statusCode} - ${err.message} - ${req.method} ${req.path}`);
  }

  // Create a copy of error to modify
  let error = err;

  // Handle specific error types
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }

  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = handleMongoError(err);
  }

  // Handle syntax errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = AppError.badRequest('Invalid JSON in request body');
  }

  // For non-operational errors in production, send generic message
  if (!error.isOperational && !isDev) {
    error = AppError.internal('Something went wrong');
  }

  // Send response
  res.status(error.statusCode).json(formatErrorResponse(error, isDev));
};

// ============================================
// 404 HANDLER
// ============================================

/**
 * Handle 404 Not Found for unmatched routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const message = `Cannot ${req.method} ${req.originalUrl}`;
  next(AppError.notFound(message));
};

// ============================================
// ASYNC HANDLER WRAPPER
// ============================================

/**
 * Wrap async route handlers to catch errors
 * Eliminates the need for try-catch in every route
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};