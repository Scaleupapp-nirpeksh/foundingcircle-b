/**
 * @fileoverview Custom API Error class for consistent error handling
 * 
 * This class extends the built-in Error class to include:
 * - HTTP status codes
 * - Error codes for programmatic handling
 * - Operational vs programming error distinction
 * 
 * @module utils/ApiError
 */

/**
 * Custom error class for API errors
 * @extends Error
 */
class ApiError extends Error {
    /**
     * Creates an ApiError instance
     * @param {number} statusCode - HTTP status code (e.g., 400, 401, 404, 500)
     * @param {string} message - Human-readable error message
     * @param {Object} options - Additional error options
     * @param {string} [options.code] - Machine-readable error code (e.g., 'INVALID_EMAIL')
     * @param {boolean} [options.isOperational=true] - Whether this is an operational error
     * @param {Object} [options.errors] - Validation errors or additional error details
     * @param {string} [options.stack] - Custom stack trace
     */
    constructor(
      statusCode,
      message,
      { code = null, isOperational = true, errors = null, stack = '' } = {}
    ) {
      super(message);
  
      // HTTP status code
      this.statusCode = statusCode;
  
      // HTTP status type (e.g., 'fail' for 4xx, 'error' for 5xx)
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  
      // Machine-readable error code
      this.code = code;
  
      // Whether this is an operational error (expected) or programming error (bug)
      this.isOperational = isOperational;
  
      // Additional error details (e.g., validation errors)
      this.errors = errors;
  
      // Timestamp when error occurred
      this.timestamp = new Date().toISOString();
  
      // Capture stack trace
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  
    /**
     * Converts error to JSON for API response
     * @param {boolean} includeStack - Whether to include stack trace (only in development)
     * @returns {Object} Error as plain object
     */
    toJSON(includeStack = false) {
      const response = {
        success: false,
        status: this.status,
        statusCode: this.statusCode,
        message: this.message,
        code: this.code,
        timestamp: this.timestamp,
      };
  
      // Include validation errors if present
      if (this.errors) {
        response.errors = this.errors;
      }
  
      // Include stack trace only in development
      if (includeStack && this.stack) {
        response.stack = this.stack;
      }
  
      return response;
    }
  
    // ============================================
    // STATIC FACTORY METHODS (Common Errors)
    // ============================================
  
    /**
     * Creates a 400 Bad Request error
     * @param {string} [message='Bad Request'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static badRequest(message = 'Bad Request', options = {}) {
      return new ApiError(400, message, { code: 'BAD_REQUEST', ...options });
    }
  
    /**
     * Creates a 401 Unauthorized error
     * @param {string} [message='Unauthorized'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static unauthorized(message = 'Unauthorized', options = {}) {
      return new ApiError(401, message, { code: 'UNAUTHORIZED', ...options });
    }
  
    /**
     * Creates a 403 Forbidden error
     * @param {string} [message='Forbidden'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static forbidden(message = 'Forbidden', options = {}) {
      return new ApiError(403, message, { code: 'FORBIDDEN', ...options });
    }
  
    /**
     * Creates a 404 Not Found error
     * @param {string} [message='Not Found'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static notFound(message = 'Not Found', options = {}) {
      return new ApiError(404, message, { code: 'NOT_FOUND', ...options });
    }
  
    /**
     * Creates a 409 Conflict error (e.g., duplicate entry)
     * @param {string} [message='Conflict'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static conflict(message = 'Conflict', options = {}) {
      return new ApiError(409, message, { code: 'CONFLICT', ...options });
    }
  
    /**
     * Creates a 422 Unprocessable Entity error (validation failed)
     * @param {string} [message='Validation Error'] - Error message
     * @param {Object} [errors] - Validation error details
     * @returns {ApiError}
     */
    static validationError(message = 'Validation Error', errors = null) {
      return new ApiError(422, message, { code: 'VALIDATION_ERROR', errors });
    }
  
    /**
     * Creates a 429 Too Many Requests error
     * @param {string} [message='Too Many Requests'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static tooManyRequests(message = 'Too Many Requests', options = {}) {
      return new ApiError(429, message, { code: 'TOO_MANY_REQUESTS', ...options });
    }
  
    /**
     * Creates a 500 Internal Server Error
     * @param {string} [message='Internal Server Error'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static internal(message = 'Internal Server Error', options = {}) {
      return new ApiError(500, message, { 
        code: 'INTERNAL_ERROR', 
        isOperational: false, 
        ...options 
      });
    }
  
    /**
     * Creates a 503 Service Unavailable error
     * @param {string} [message='Service Unavailable'] - Error message
     * @param {Object} [options] - Additional options
     * @returns {ApiError}
     */
    static serviceUnavailable(message = 'Service Unavailable', options = {}) {
      return new ApiError(503, message, { code: 'SERVICE_UNAVAILABLE', ...options });
    }
  
    // ============================================
    // DOMAIN-SPECIFIC ERRORS
    // ============================================
  
    /**
     * Creates an authentication error
     * @param {string} [message='Authentication failed'] - Error message
     * @returns {ApiError}
     */
    static authenticationFailed(message = 'Authentication failed') {
      return new ApiError(401, message, { code: 'AUTHENTICATION_FAILED' });
    }
  
    /**
     * Creates an invalid token error
     * @param {string} [message='Invalid or expired token'] - Error message
     * @returns {ApiError}
     */
    static invalidToken(message = 'Invalid or expired token') {
      return new ApiError(401, message, { code: 'INVALID_TOKEN' });
    }
  
    /**
     * Creates an expired token error
     * @param {string} [message='Token has expired'] - Error message
     * @returns {ApiError}
     */
    static tokenExpired(message = 'Token has expired') {
      return new ApiError(401, message, { code: 'TOKEN_EXPIRED' });
    }
  
    /**
     * Creates an invalid OTP error
     * @param {string} [message='Invalid or expired OTP'] - Error message
     * @returns {ApiError}
     */
    static invalidOTP(message = 'Invalid or expired OTP') {
      return new ApiError(400, message, { code: 'INVALID_OTP' });
    }
  
    /**
     * Creates an OTP expired error
     * @param {string} [message='OTP has expired'] - Error message
     * @returns {ApiError}
     */
    static otpExpired(message = 'OTP has expired') {
      return new ApiError(400, message, { code: 'OTP_EXPIRED' });
    }
  
    /**
     * Creates an OTP max attempts error
     * @param {string} [message='Maximum OTP attempts exceeded'] - Error message
     * @returns {ApiError}
     */
    static otpMaxAttempts(message = 'Maximum OTP attempts exceeded') {
      return new ApiError(429, message, { code: 'OTP_MAX_ATTEMPTS' });
    }
  
    /**
     * Creates a user not found error
     * @param {string} [message='User not found'] - Error message
     * @returns {ApiError}
     */
    static userNotFound(message = 'User not found') {
      return new ApiError(404, message, { code: 'USER_NOT_FOUND' });
    }
  
    /**
     * Creates a user already exists error
     * @param {string} [message='User already exists'] - Error message
     * @returns {ApiError}
     */
    static userAlreadyExists(message = 'User already exists') {
      return new ApiError(409, message, { code: 'USER_ALREADY_EXISTS' });
    }
  
    /**
     * Creates an invalid credentials error
     * @param {string} [message='Invalid email or password'] - Error message
     * @returns {ApiError}
     */
    static invalidCredentials(message = 'Invalid email or password') {
      return new ApiError(401, message, { code: 'INVALID_CREDENTIALS' });
    }
  
    /**
     * Creates an account suspended error
     * @param {string} [message='Account has been suspended'] - Error message
     * @returns {ApiError}
     */
    static accountSuspended(message = 'Account has been suspended') {
      return new ApiError(403, message, { code: 'ACCOUNT_SUSPENDED' });
    }
  
    /**
     * Creates an onboarding incomplete error
     * @param {string} [message='Please complete your profile first'] - Error message
     * @returns {ApiError}
     */
    static onboardingIncomplete(message = 'Please complete your profile first') {
      return new ApiError(403, message, { code: 'ONBOARDING_INCOMPLETE' });
    }
  
    /**
     * Creates an opening not found error
     * @param {string} [message='Opening not found'] - Error message
     * @returns {ApiError}
     */
    static openingNotFound(message = 'Opening not found') {
      return new ApiError(404, message, { code: 'OPENING_NOT_FOUND' });
    }
  
    /**
     * Creates a conversation not found error
     * @param {string} [message='Conversation not found'] - Error message
     * @returns {ApiError}
     */
    static conversationNotFound(message = 'Conversation not found') {
      return new ApiError(404, message, { code: 'CONVERSATION_NOT_FOUND' });
    }
  
    /**
     * Creates a daily limit reached error
     * @param {string} [message='Daily limit reached'] - Error message
     * @returns {ApiError}
     */
    static dailyLimitReached(message = 'Daily limit reached. Upgrade to Pro for unlimited access.') {
      return new ApiError(429, message, { code: 'DAILY_LIMIT_REACHED' });
    }
  
    /**
     * Creates a subscription required error
     * @param {string} [message='Subscription required for this feature'] - Error message
     * @returns {ApiError}
     */
    static subscriptionRequired(message = 'Subscription required for this feature') {
      return new ApiError(403, message, { code: 'SUBSCRIPTION_REQUIRED' });
    }
  
    /**
     * Creates a file upload error
     * @param {string} [message='File upload failed'] - Error message
     * @returns {ApiError}
     */
    static fileUploadFailed(message = 'File upload failed') {
      return new ApiError(400, message, { code: 'FILE_UPLOAD_FAILED' });
    }
  
    /**
     * Creates a file too large error
     * @param {string} [message='File size exceeds limit'] - Error message
     * @returns {ApiError}
     */
    static fileTooLarge(message = 'File size exceeds limit') {
      return new ApiError(413, message, { code: 'FILE_TOO_LARGE' });
    }
  
    /**
     * Creates an invalid file type error
     * @param {string} [message='Invalid file type'] - Error message
     * @returns {ApiError}
     */
    static invalidFileType(message = 'Invalid file type') {
      return new ApiError(400, message, { code: 'INVALID_FILE_TYPE' });
    }
  }
  
  module.exports = ApiError;