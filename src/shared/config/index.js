/**
 * @fileoverview Central configuration loader for FoundingCircle Backend
 * 
 * This module loads environment variables, validates required ones,
 * and exports a structured configuration object.
 * 
 * @module config
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

/**
 * Validates that all required environment variables are present
 * @param {string[]} requiredVars - Array of required variable names
 * @throws {Error} If any required variable is missing
 */
const validateRequiredEnvVars = (requiredVars) => {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`
    );
  }
};

// List of required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
];

// Validate required variables (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  validateRequiredEnvVars(requiredEnvVars);
}

/**
 * Application configuration object
 * @type {Object}
 */
const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      // Mongoose 8.x handles these automatically, but we can add custom options here
    },
  },
  
  // JWT Authentication
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Twilio (SMS OTP)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  // OTP Configuration
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 3,
    cooldownMinutes: parseInt(process.env.OTP_COOLDOWN_MINUTES, 10) || 15,
    length: 6, // 6-digit OTP
  },
  
  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
  
  // File Upload Limits
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    maxProfilePhotoSize: parseInt(process.env.MAX_PROFILE_PHOTO_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocTypes: ['application/pdf'],
  },
  
  // CORS
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Parse allowed origins from env
      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:3000'];

      // Check if origin is in allowed list or is a lovable.app subdomain
      if (allowedOrigins.includes(origin) || origin.endsWith('.lovable.app')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
      maxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 10,
    },
  },
  
  // Matching Engine
  matching: {
    cronSchedule: process.env.MATCHING_CRON_SCHEDULE || '0 2 * * *', // 2 AM daily
    dailyLimits: {
      free: parseInt(process.env.FREE_DAILY_MATCH_LIMIT, 10) || 5,
      pro: parseInt(process.env.PRO_DAILY_MATCH_LIMIT, 10) || 999,
      boost: parseInt(process.env.BOOST_DAILY_MATCH_LIMIT, 10) || 15,
    },
    // Matching algorithm weights
    weights: {
      skills: 0.25,
      compensation: 0.25,
      commitment: 0.20,
      scenario: 0.15,
      geography: 0.15,
    },
  },
  
  // Subscription Pricing (in smallest currency unit - paise for INR)
  subscription: {
    founderPro: {
      priceINR: parseInt(process.env.FOUNDER_PRO_PRICE_INR, 10) || 149900, // ₹1,499
      features: {
        dailyMatches: 999,
        activeListings: 5,
        savedProfiles: 999,
        priorityDiscovery: true,
        stealthMode: true,
        verifiedBadge: true,
        advancedAnalytics: true,
      },
    },
    builderBoost: {
      priceINR: parseInt(process.env.BUILDER_BOOST_PRICE_INR, 10) || 39900, // ₹399
      features: {
        dailyMatches: 15,
        savedProfiles: 50,
        priorityDiscovery: true,
      },
    },
    free: {
      features: {
        dailyMatches: 5,
        activeListings: 1,
        savedProfiles: 10,
        priorityDiscovery: false,
        stealthMode: false,
        verifiedBadge: false,
        advancedAnalytics: false,
      },
    },
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
  
  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@foundingcircle.com',
    password: process.env.ADMIN_PASSWORD,
  },
};

/**
 * Checks if the application is running in development mode
 * @returns {boolean}
 */
const isDevelopment = () => config.env === 'development';

/**
 * Checks if the application is running in production mode
 * @returns {boolean}
 */
const isProduction = () => config.env === 'production';

/**
 * Checks if the application is running in test mode
 * @returns {boolean}
 */
const isTest = () => config.env === 'test';

module.exports = {
  config,
  isDevelopment,
  isProduction,
  isTest,
};
