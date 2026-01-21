/**
 * @fileoverview Miscellaneous helper functions
 * 
 * Contains utility functions used throughout the application:
 * - String manipulation
 * - Date/time utilities
 * - Object utilities
 * - Random generators
 * - Validation helpers
 * 
 * @module utils/helpers
 */

const crypto = require('crypto');

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generates a URL-friendly slug from a string
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-friendly slug
 * 
 * @example
 * slugify('Hello World!') // 'hello-world'
 * slugify('  Multiple   Spaces  ') // 'multiple-spaces'
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start
    .replace(/-+$/, '');         // Trim - from end
};

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 * 
 * @example
 * capitalize('hello') // 'Hello'
 */
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalizes the first letter of each word
 * @param {string} str - String to title case
 * @returns {string} Title cased string
 * 
 * @example
 * titleCase('hello world') // 'Hello World'
 */
const titleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Truncates a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} [suffix='...'] - Suffix to add if truncated
 * @returns {string} Truncated string
 * 
 * @example
 * truncate('Hello World', 5) // 'Hello...'
 */
const truncate = (str, length, suffix = '...') => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

/**
 * Masks sensitive data (shows first and last few characters)
 * @param {string} str - String to mask
 * @param {number} [visibleStart=2] - Visible characters at start
 * @param {number} [visibleEnd=2] - Visible characters at end
 * @param {string} [maskChar='*'] - Character to use for masking
 * @returns {string} Masked string
 * 
 * @example
 * maskString('1234567890', 2, 2) // '12******90'
 * maskString('email@example.com', 3, 4) // 'ema**********@example.com'
 */
const maskString = (str, visibleStart = 2, visibleEnd = 2, maskChar = '*') => {
  if (!str) return '';
  if (str.length <= visibleStart + visibleEnd) return str;
  
  const start = str.substring(0, visibleStart);
  const end = str.substring(str.length - visibleEnd);
  const maskLength = str.length - visibleStart - visibleEnd;
  const mask = maskChar.repeat(Math.min(maskLength, 8)); // Cap mask at 8 chars
  
  return `${start}${mask}${end}`;
};

/**
 * Masks an email address for logging/display
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 * 
 * @example
 * maskEmail('user@example.com') // 'us**@example.com'
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  const maskedLocal = maskString(localPart, 2, 0, '*');
  
  return `${maskedLocal}@${domain}`;
};

/**
 * Masks a phone number for logging/display
 * @param {string} phone - Phone number to mask
 * @returns {string} Masked phone
 * 
 * @example
 * maskPhone('+919876543210') // '+91******3210'
 */
const maskPhone = (phone) => {
  if (!phone) return '';
  return maskString(phone, 3, 4);
};

// ============================================
// RANDOM GENERATORS
// ============================================

/**
 * Generates a random numeric OTP
 * @param {number} [length=6] - Length of OTP
 * @returns {string} Random OTP
 * 
 * @example
 * generateOTP() // '482951'
 * generateOTP(4) // '7382'
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

/**
 * Generates a cryptographically secure random string
 * @param {number} [length=32] - Length of string
 * @returns {string} Random hex string
 * 
 * @example
 * generateRandomString(16) // 'a1b2c3d4e5f6g7h8'
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Generates a unique ID with optional prefix
 * @param {string} [prefix=''] - Prefix for the ID
 * @returns {string} Unique ID
 * 
 * @example
 * generateUniqueId('usr') // 'usr_a1b2c3d4e5f6'
 */
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = generateRandomString(8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
};

// ============================================
// DATE/TIME UTILITIES
// ============================================

/**
 * Calculates time difference in human-readable format
 * @param {Date|string} date - Date to compare
 * @returns {string} Human-readable time difference
 * 
 * @example
 * timeAgo(new Date(Date.now() - 60000)) // '1 minute ago'
 * timeAgo(new Date(Date.now() - 3600000)) // '1 hour ago'
 */
const timeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now - past) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};

/**
 * Adds time to a date
 * @param {Date} date - Starting date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit (seconds, minutes, hours, days)
 * @returns {Date} New date
 * 
 * @example
 * addTime(new Date(), 10, 'minutes')
 * addTime(new Date(), 7, 'days')
 */
const addTime = (date, amount, unit) => {
  const d = new Date(date);
  
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };
  
  const multiplier = multipliers[unit] || multipliers.seconds;
  d.setTime(d.getTime() + amount * multiplier);
  
  return d;
};

/**
 * Checks if a date is expired
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if expired
 * 
 * @example
 * isExpired(new Date(Date.now() - 1000)) // true
 * isExpired(new Date(Date.now() + 1000)) // false
 */
const isExpired = (date) => {
  return new Date(date) < new Date();
};

/**
 * Formats a date to ISO string (date only)
 * @param {Date} date - Date to format
 * @returns {string} YYYY-MM-DD format
 * 
 * @example
 * formatDate(new Date()) // '2026-01-14'
 */
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Gets start of day for a date
 * @param {Date} date - Input date
 * @returns {Date} Start of day
 */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Gets end of day for a date
 * @param {Date} date - Input date
 * @returns {Date} End of day
 */
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// ============================================
// OBJECT UTILITIES
// ============================================

/**
 * Picks specified keys from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {Object} New object with only specified keys
 * 
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { a: 1, c: 3 }
 */
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Omits specified keys from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to omit
 * @returns {Object} New object without specified keys
 * 
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['b']) // { a: 1, c: 3 }
 */
const omit = (obj, keys) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Removes null, undefined, and empty string values from object
 * @param {Object} obj - Source object
 * @returns {Object} Cleaned object
 * 
 * @example
 * cleanObject({ a: 1, b: null, c: '', d: 0 }) // { a: 1, d: 0 }
 */
const cleanObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * Deep clones an object (simple implementation)
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Checks if an object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if empty
 * 
 * @example
 * isEmpty({}) // true
 * isEmpty({ a: 1 }) // false
 */
const isEmpty = (obj) => {
  return !obj || Object.keys(obj).length === 0;
};

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Removes duplicate values from array
 * @param {Array} arr - Array with possible duplicates
 * @returns {Array} Array with unique values
 * 
 * @example
 * unique([1, 2, 2, 3, 3, 3]) // [1, 2, 3]
 */
const unique = (arr) => {
  return [...new Set(arr)];
};

/**
 * Chunks an array into smaller arrays
 * @param {Array} arr - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array[]} Array of chunks
 * 
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Shuffles an array (Fisher-Yates algorithm)
 * @param {Array} arr - Array to shuffle
 * @returns {Array} Shuffled array (new array)
 * 
 * @example
 * shuffle([1, 2, 3, 4, 5]) // [3, 1, 5, 2, 4] (random)
 */
const shuffle = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates Indian phone number format
 * @param {string} phone - Phone to validate (with or without +91)
 * @returns {boolean} True if valid
 */
const isValidIndianPhone = (phone) => {
  // Accepts: +919876543210, 919876543210, 9876543210
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Normalizes Indian phone number to +91 format
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone (+919876543210)
 * 
 * @example
 * normalizePhone('9876543210') // '+919876543210'
 * normalizePhone('919876543210') // '+919876543210'
 */
const normalizePhone = (phone) => {
  const cleaned = phone.replace(/\s/g, '').replace(/^\+/, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  return `+${cleaned}`;
};

/**
 * Checks if a string is a valid MongoDB ObjectId
 * @param {string} id - String to check
 * @returns {boolean} True if valid ObjectId format
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// ============================================
// PAGINATION HELPERS
// ============================================

/**
 * Parses pagination params from query
 * @param {Object} query - Express query object
 * @param {Object} [defaults={}] - Default values
 * @returns {Object} Parsed pagination
 * 
 * @example
 * parsePagination({ page: '2', limit: '20' })
 * // { page: 2, limit: 20, skip: 20 }
 */
const parsePagination = (query, defaults = {}) => {
  const {
    page = defaults.page || 1,
    limit = defaults.limit || 10,
  } = query;
  
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // String utilities
  slugify,
  capitalize,
  titleCase,
  truncate,
  maskString,
  maskEmail,
  maskPhone,
  
  // Random generators
  generateOTP,
  generateRandomString,
  generateUniqueId,
  
  // Date/time utilities
  timeAgo,
  addTime,
  isExpired,
  formatDate,
  startOfDay,
  endOfDay,
  
  // Object utilities
  pick,
  omit,
  cleanObject,
  deepClone,
  isEmpty,
  
  // Array utilities
  unique,
  chunk,
  shuffle,
  
  // Validation helpers
  isValidEmail,
  isValidIndianPhone,
  normalizePhone,
  isValidObjectId,
  
  // Pagination
  parsePagination,
};