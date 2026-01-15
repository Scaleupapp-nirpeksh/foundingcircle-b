/**
 * @fileoverview Winston-based logging utility
 * 
 * Provides structured logging with multiple transports:
 * - Console (colorized for development)
 * - File (for production error tracking)
 * 
 * @module utils/logger
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Get config (with fallback for when config isn't loaded yet)
let config;
try {
  config = require('../config').config;
} catch (error) {
  config = {
    env: process.env.NODE_ENV || 'development',
    logging: {
      level: process.env.LOG_LEVEL || 'debug',
      filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
    },
  };
}

// ============================================
// LOG DIRECTORY SETUP
// ============================================

// Ensure logs directory exists
const logDir = path.dirname(config.logging.filePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ============================================
// CUSTOM LOG LEVELS & COLORS
// ============================================

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

// Tell winston about our custom colors
winston.addColors(colors);

// ============================================
// LOG FORMATS
// ============================================

/**
 * Format for console output (colorized, human-readable)
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Format metadata if present
    const metaString = Object.keys(meta).length 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

/**
 * Format for file output (JSON, machine-readable)
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Format for production console (no colors, JSON)
 */
const productionConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================
// TRANSPORTS
// ============================================

/**
 * Get transports based on environment
 * @returns {winston.transport[]} Array of transports
 */
const getTransports = () => {
  const transports = [];

  // Console transport (always)
  if (config.env === 'development') {
    // Colorized output for development
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      })
    );
  } else {
    // JSON output for production (better for log aggregators)
    transports.push(
      new winston.transports.Console({
        format: productionConsoleFormat,
      })
    );
  }

  // File transports (production and development)
  if (config.env !== 'test') {
    // All logs
    transports.push(
      new winston.transports.File({
        filename: config.logging.filePath,
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Error logs only (separate file)
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return transports;
};

// ============================================
// CREATE LOGGER
// ============================================

/**
 * Main logger instance
 */
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : config.logging.level,
  levels,
  transports: getTransports(),
  // Don't exit on error
  exitOnError: false,
});

// ============================================
// HELPER METHODS
// ============================================

/**
 * Log HTTP requests (for Morgan integration)
 * @param {string} message - HTTP log message
 */
logger.http = (message) => {
  logger.log('http', message);
};

/**
 * Log an error with stack trace
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} [meta={}] - Additional metadata
 */
logger.logError = (message, error, meta = {}) => {
  logger.error(message, {
    ...meta,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });
};

/**
 * Log API request details
 * @param {Object} req - Express request object
 * @param {Object} [extra={}] - Additional data to log
 */
logger.logRequest = (req, extra = {}) => {
  logger.info('API Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    ...extra,
  });
};

/**
 * Log API response details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logResponse = (req, res, duration) => {
  const level = res.statusCode >= 400 ? 'warn' : 'info';
  logger[level]('API Response', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.id || 'anonymous',
  });
};

/**
 * Log database operations
 * @param {string} operation - Operation type (find, create, update, delete)
 * @param {string} collection - Collection name
 * @param {Object} [details={}] - Additional details
 */
logger.logDB = (operation, collection, details = {}) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    ...details,
  });
};

/**
 * Log authentication events
 * @param {string} event - Event type (login, logout, register, etc.)
 * @param {Object} [details={}] - Additional details
 */
logger.logAuth = (event, details = {}) => {
  logger.info('Auth Event', {
    event,
    ...details,
  });
};

/**
 * Log matching engine events
 * @param {string} event - Event type
 * @param {Object} [details={}] - Additional details
 */
logger.logMatching = (event, details = {}) => {
  logger.info('Matching Event', {
    event,
    ...details,
  });
};

/**
 * Create a child logger with default metadata
 * Useful for adding context to all logs in a module
 * @param {Object} defaultMeta - Default metadata to include
 * @returns {Object} Child logger
 */
logger.child = (defaultMeta) => {
  return {
    error: (msg, meta = {}) => logger.error(msg, { ...defaultMeta, ...meta }),
    warn: (msg, meta = {}) => logger.warn(msg, { ...defaultMeta, ...meta }),
    info: (msg, meta = {}) => logger.info(msg, { ...defaultMeta, ...meta }),
    http: (msg, meta = {}) => logger.http(msg, { ...defaultMeta, ...meta }),
    debug: (msg, meta = {}) => logger.debug(msg, { ...defaultMeta, ...meta }),
  };
};

// ============================================
// STREAM FOR MORGAN
// ============================================

/**
 * Stream for Morgan HTTP logger integration
 */
logger.stream = {
  write: (message) => {
    // Remove trailing newline from Morgan
    logger.http(message.trim());
  },
};

// ============================================
// EXPORTS
// ============================================

module.exports = logger;