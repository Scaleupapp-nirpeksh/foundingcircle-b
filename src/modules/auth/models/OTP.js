/**
 * @fileoverview OTP model for phone/email verification
 * 
 * Handles:
 * - OTP storage with hashing
 * - Expiry management
 * - Attempt tracking
 * - Cooldown enforcement
 * - Multiple purposes (login, registration, password reset)
 * 
 * @module models/OTP
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OTP_PURPOSE, OTP_STATUS } = require('../../../shared/constants');
const { config } = require('../../../shared/config');

const { Schema } = mongoose;

// ============================================
// SCHEMA DEFINITION
// ============================================

const otpSchema = new Schema(
  {
    /**
     * Identifier - email or phone number
     * Used to look up the OTP
     */
    identifier: {
      type: String,
      required: [true, 'Identifier (email/phone) is required'],
      trim: true,
      lowercase: true,
      index: true,
    },

    /**
     * Type of identifier
     */
    identifierType: {
      type: String,
      enum: ['EMAIL', 'PHONE'],
      required: true,
    },

    /**
     * Hashed OTP value
     * We hash it for security (like passwords)
     */
    otp: {
      type: String,
      required: [true, 'OTP is required'],
      select: false, // Don't return in queries by default
    },

    /**
     * Purpose of the OTP
     */
    purpose: {
      type: String,
      enum: {
        values: Object.values(OTP_PURPOSE),
        message: 'Invalid OTP purpose',
      },
      required: [true, 'OTP purpose is required'],
      index: true,
    },

    /**
     * Current status of the OTP
     */
    status: {
      type: String,
      enum: {
        values: Object.values(OTP_STATUS),
        message: 'Invalid OTP status',
      },
      default: OTP_STATUS.PENDING,
    },

    /**
     * Number of verification attempts
     */
    attempts: {
      type: Number,
      default: 0,
    },

    /**
     * Maximum allowed attempts
     */
    maxAttempts: {
      type: Number,
      default: config.otp.maxAttempts || 3,
    },

    /**
     * OTP expiry time
     */
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    /**
     * When the OTP was verified (if verified)
     */
    verifiedAt: {
      type: Date,
      default: null,
    },

    /**
     * IP address that requested the OTP
     */
    requestedFromIp: {
      type: String,
      default: null,
    },

    /**
     * IP address that verified the OTP
     */
    verifiedFromIp: {
      type: String,
      default: null,
    },

    /**
     * User agent that requested the OTP
     */
    userAgent: {
      type: String,
      default: null,
    },

    /**
     * Reference to user (if exists)
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /**
     * Additional metadata
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    // ==========================================
    // SCHEMA OPTIONS
    // ==========================================
    
    timestamps: true,
    
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.otp;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// INDEXES
// ============================================

// Compound index for lookups
otpSchema.index({ identifier: 1, purpose: 1, status: 1 });

// TTL index - automatically delete expired OTPs after 24 hours
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

// Index for cleanup queries
otpSchema.index({ createdAt: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if OTP is expired
 */
otpSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

/**
 * Check if max attempts exceeded
 */
otpSchema.virtual('isMaxAttemptsExceeded').get(function () {
  return this.attempts >= this.maxAttempts;
});

/**
 * Check if OTP is still valid (not expired, not max attempts, pending)
 */
otpSchema.virtual('isValid').get(function () {
  return (
    this.status === OTP_STATUS.PENDING &&
    !this.isExpired &&
    !this.isMaxAttemptsExceeded
  );
});

/**
 * Time remaining until expiry (in seconds)
 */
otpSchema.virtual('timeRemaining').get(function () {
  const remaining = Math.floor((this.expiresAt - new Date()) / 1000);
  return remaining > 0 ? remaining : 0;
});

/**
 * Attempts remaining
 */
otpSchema.virtual('attemptsRemaining').get(function () {
  return Math.max(0, this.maxAttempts - this.attempts);
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Hash OTP before saving (only if modified)
 */
otpSchema.pre('save', async function (next) {
  if (!this.isModified('otp')) {
    return next();
  }

  try {
    // Hash the OTP
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Verify OTP against stored hash
 * @param {string} candidateOtp - OTP to verify
 * @returns {Promise<boolean>} True if OTP matches
 */
otpSchema.methods.verifyOtp = async function (candidateOtp) {
  try {
    // Need to fetch OTP field explicitly
    const otpDoc = await this.constructor.findById(this._id).select('+otp');
    if (!otpDoc || !otpDoc.otp) {
      return false;
    }
    return await bcrypt.compare(candidateOtp, otpDoc.otp);
  } catch (error) {
    return false;
  }
};

/**
 * Increment attempt counter
 * @returns {Promise<void>}
 */
otpSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  
  // Check if max attempts exceeded
  if (this.attempts >= this.maxAttempts) {
    this.status = OTP_STATUS.MAX_ATTEMPTS;
  }
  
  await this.save();
};

/**
 * Mark OTP as verified
 * @param {string} [ip] - IP address of verification
 * @returns {Promise<void>}
 */
otpSchema.methods.markVerified = async function (ip = null) {
  this.status = OTP_STATUS.VERIFIED;
  this.verifiedAt = new Date();
  if (ip) {
    this.verifiedFromIp = ip;
  }
  await this.save();
};

/**
 * Mark OTP as expired
 * @returns {Promise<void>}
 */
otpSchema.methods.markExpired = async function () {
  this.status = OTP_STATUS.EXPIRED;
  await this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Generate a random numeric OTP
 * @param {number} [length=6] - OTP length
 * @returns {string} Generated OTP
 */
otpSchema.statics.generateOtp = function (length = config.otp.length || 6) {
  // Use crypto for better randomness
  const digits = '0123456789';
  let otp = '';
  
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  
  return otp;
};

/**
 * Create and save a new OTP
 * @param {Object} options - OTP options
 * @param {string} options.identifier - Email or phone
 * @param {string} options.identifierType - 'EMAIL' or 'PHONE'
 * @param {string} options.purpose - OTP purpose
 * @param {string} [options.ip] - Request IP
 * @param {string} [options.userAgent] - User agent
 * @param {ObjectId} [options.userId] - Associated user ID
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<{otpDoc: OTP, plainOtp: string}>} Created OTP document and plain OTP
 */
otpSchema.statics.createOtp = async function (options) {
  const {
    identifier,
    identifierType,
    purpose,
    ip = null,
    userAgent = null,
    userId = null,
    metadata = {},
  } = options;

  // Invalidate any existing pending OTPs for this identifier and purpose
  await this.invalidatePendingOtps(identifier, purpose);

  // Generate plain OTP
  const plainOtp = this.generateOtp();

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (config.otp.expiryMinutes || 10));

  // Create OTP document
  const otpDoc = await this.create({
    identifier: identifier.toLowerCase(),
    identifierType,
    otp: plainOtp, // Will be hashed by pre-save middleware
    purpose,
    expiresAt,
    requestedFromIp: ip,
    userAgent,
    user: userId,
    metadata,
  });

  // Return both the document and plain OTP (for sending to user)
  return {
    otpDoc,
    plainOtp,
  };
};

/**
 * Find valid OTP for verification
 * @param {string} identifier - Email or phone
 * @param {string} purpose - OTP purpose
 * @returns {Promise<OTP|null>} Valid OTP or null
 */
otpSchema.statics.findValidOtp = function (identifier, purpose) {
  return this.findOne({
    identifier: identifier.toLowerCase(),
    purpose,
    status: OTP_STATUS.PENDING,
    expiresAt: { $gt: new Date() },
    $expr: { $lt: ['$attempts', '$maxAttempts'] },
  }).select('+otp');
};

/**
 * Verify OTP for an identifier
 * @param {string} identifier - Email or phone
 * @param {string} purpose - OTP purpose
 * @param {string} otpCode - OTP to verify
 * @param {string} [ip] - Verification IP
 * @returns {Promise<{success: boolean, message: string, otpDoc?: OTP}>}
 */
otpSchema.statics.verifyOtpForIdentifier = async function (identifier, purpose, otpCode, ip = null) {
  // Find valid OTP
  const otpDoc = await this.findValidOtp(identifier, purpose);

  // No valid OTP found
  if (!otpDoc) {
    // Check if there's an expired or max attempts OTP
    const existingOtp = await this.findOne({
      identifier: identifier.toLowerCase(),
      purpose,
    }).sort({ createdAt: -1 });

    if (existingOtp) {
      if (existingOtp.isExpired || existingOtp.status === OTP_STATUS.EXPIRED) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
      }
      if (existingOtp.isMaxAttemptsExceeded || existingOtp.status === OTP_STATUS.MAX_ATTEMPTS) {
        return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
      }
    }

    return { success: false, message: 'Invalid or expired OTP.' };
  }

  // Verify OTP
  const isValid = await bcrypt.compare(otpCode, otpDoc.otp);

  if (!isValid) {
    // Increment attempts
    await otpDoc.incrementAttempts();
    
    const remaining = otpDoc.attemptsRemaining;
    if (remaining === 0) {
      return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
    }
    
    return { 
      success: false, 
      message: `Invalid OTP. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.` 
    };
  }

  // Mark as verified
  await otpDoc.markVerified(ip);

  return { success: true, message: 'OTP verified successfully.', otpDoc };
};

/**
 * Invalidate all pending OTPs for an identifier and purpose
 * @param {string} identifier - Email or phone
 * @param {string} purpose - OTP purpose
 * @returns {Promise<void>}
 */
otpSchema.statics.invalidatePendingOtps = async function (identifier, purpose) {
  await this.updateMany(
    {
      identifier: identifier.toLowerCase(),
      purpose,
      status: OTP_STATUS.PENDING,
    },
    {
      $set: { status: OTP_STATUS.EXPIRED },
    }
  );
};

/**
 * Check if user can request a new OTP (cooldown check)
 * @param {string} identifier - Email or phone
 * @param {string} purpose - OTP purpose
 * @returns {Promise<{canRequest: boolean, waitTime?: number}>}
 */
otpSchema.statics.canRequestOtp = async function (identifier, purpose) {
  const cooldownMinutes = config.otp.cooldownMinutes || 1;
  const cooldownMs = cooldownMinutes * 60 * 1000;

  // Find the most recent OTP for this identifier and purpose
  const recentOtp = await this.findOne({
    identifier: identifier.toLowerCase(),
    purpose,
  }).sort({ createdAt: -1 });

  if (!recentOtp) {
    return { canRequest: true };
  }

  const timeSinceLastOtp = Date.now() - recentOtp.createdAt.getTime();

  if (timeSinceLastOtp < cooldownMs) {
    const waitTime = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
    return { canRequest: false, waitTime };
  }

  return { canRequest: true };
};

/**
 * Get OTP statistics for an identifier
 * @param {string} identifier - Email or phone
 * @returns {Promise<Object>} Statistics
 */
otpSchema.statics.getOtpStats = async function (identifier) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stats = await this.aggregate([
    {
      $match: {
        identifier: identifier.toLowerCase(),
        createdAt: { $gte: twentyFourHoursAgo },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalRequests = await this.countDocuments({
    identifier: identifier.toLowerCase(),
    createdAt: { $gte: twentyFourHoursAgo },
  });

  return {
    totalRequestsLast24h: totalRequests,
    byStatus: stats.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
  };
};

/**
 * Clean up old OTP records (called by cron job)
 * @param {number} [daysOld=7] - Delete records older than this
 * @returns {Promise<number>} Number of deleted records
 */
otpSchema.statics.cleanupOldRecords = async function (daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

// ============================================
// MODEL EXPORT
// ============================================

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
