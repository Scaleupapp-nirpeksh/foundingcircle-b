/**
 * @fileoverview Utils module aggregator
 * 
 * Re-exports all utility modules for convenient importing.
 * 
 * @module utils
 * 
 * @example
 * // Import everything you need in one line
 * const { ApiError, ApiResponse, asyncHandler, logger, helpers } = require('./utils');
 * 
 * // Or import specific items
 * const { ApiError, asyncHandler } = require('./utils');
 */

const ApiError = require('./ApiError');
const ApiResponse = require('./ApiResponse');
const { 
  asyncHandler, 
  asyncHandlerAlt, 
  asyncHandlerAll, 
  asyncHandlerWithTransform 
} = require('./asyncHandler');
const logger = require('./logger');
const helpers = require('./helpers');

// ============================================
// NAMED EXPORTS
// ============================================

module.exports = {
  // Error handling
  ApiError,
  
  // Response formatting
  ApiResponse,
  
  // Async handlers
  asyncHandler,
  asyncHandlerAlt,
  asyncHandlerAll,
  asyncHandlerWithTransform,
  
  // Logging
  logger,
  
  // Helper functions (as namespace)
  helpers,
  
  // Also export individual helpers for convenience
  // String utilities
  slugify: helpers.slugify,
  capitalize: helpers.capitalize,
  titleCase: helpers.titleCase,
  truncate: helpers.truncate,
  maskString: helpers.maskString,
  maskEmail: helpers.maskEmail,
  maskPhone: helpers.maskPhone,
  
  // Random generators
  generateOTP: helpers.generateOTP,
  generateRandomString: helpers.generateRandomString,
  generateUniqueId: helpers.generateUniqueId,
  
  // Date/time utilities
  timeAgo: helpers.timeAgo,
  addTime: helpers.addTime,
  isExpired: helpers.isExpired,
  formatDate: helpers.formatDate,
  startOfDay: helpers.startOfDay,
  endOfDay: helpers.endOfDay,
  
  // Object utilities
  pick: helpers.pick,
  omit: helpers.omit,
  cleanObject: helpers.cleanObject,
  deepClone: helpers.deepClone,
  isEmpty: helpers.isEmpty,
  
  // Array utilities
  unique: helpers.unique,
  chunk: helpers.chunk,
  shuffle: helpers.shuffle,
  
  // Validation helpers
  isValidEmail: helpers.isValidEmail,
  isValidIndianPhone: helpers.isValidIndianPhone,
  normalizePhone: helpers.normalizePhone,
  isValidObjectId: helpers.isValidObjectId,
  
  // Pagination
  parsePagination: helpers.parsePagination,
};