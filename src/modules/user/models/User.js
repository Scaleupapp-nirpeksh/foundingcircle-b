/**
 * @fileoverview User model - Base user authentication and identity
 * 
 * This is the core user model that handles:
 * - Authentication (email/password, phone/OTP)
 * - User type (FOUNDER, BUILDER, ADMIN)
 * - Subscription management
 * - Account status
 * 
 * @module models/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  USER_TYPES,
  USER_STATUS,
  SUBSCRIPTION_TIERS,
} = require('../../../shared/constants');

const { Schema } = mongoose;

// ============================================
// SCHEMA DEFINITION
// ============================================

const userSchema = new Schema(
  {
    // ==========================================
    // AUTHENTICATION FIELDS
    // ==========================================
    
    /**
     * Phone number for OTP authentication (primary identifier)
     * Format: +919876543210 (E.164 format)
     */
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [
        /^\+[1-9]\d{9,14}$/,
        'Please provide a valid phone number with country code (e.g., +919876543210)',
      ],
      index: true,
    },

    /**
     * User's email address (optional, can be added during onboarding)
     */
    email: {
      type: String,
      sparse: true, // Allow multiple null values
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },

    /**
     * Hashed password (not returned in queries by default)
     */
    password: {
      type: String,
      required: false,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include in query results by default
    },

    /**
     * Whether email has been verified
     */
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Whether phone has been verified
     */
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // USER TYPE & ROLE
    // ==========================================

    /**
     * Type of user - determines available features
     * Set during onboarding (not required at registration)
     */
    userType: {
      type: String,
      enum: {
        values: Object.values(USER_TYPES),
        message: 'User type must be FOUNDER, BUILDER, or ADMIN',
      },
      default: null, // Will be set during onboarding
      index: true,
    },

    /**
     * Account status
     */
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUS),
        message: 'Invalid user status',
      },
      default: USER_STATUS.ACTIVE,
      index: true,
    },

    // ==========================================
    // PROFILE REFERENCES
    // ==========================================

       /**
     * Reference to FounderProfile (can have both profiles)
     */
       founderProfile: {
        type: Schema.Types.ObjectId,
        ref: 'FounderProfile',
        default: null,
      },
  
      /**
       * Reference to BuilderProfile (can have both profiles)
       */
      builderProfile: {
        type: Schema.Types.ObjectId,
        ref: 'BuilderProfile',
        default: null,
      },
  
      /**
       * Primary/active role for the user
       * User can switch between roles if they have both profiles
       */
      activeRole: {
        type: String,
        enum: {
          values: ['FOUNDER', 'BUILDER'],
          message: 'Active role must be FOUNDER or BUILDER',
        },
        default: null,
      },

    // ==========================================
    // SUBSCRIPTION
    // ==========================================

    /**
     * Current subscription tier
     */
    subscriptionTier: {
      type: String,
      enum: {
        values: Object.values(SUBSCRIPTION_TIERS),
        message: 'Invalid subscription tier',
      },
      default: SUBSCRIPTION_TIERS.FREE,
      index: true,
    },

    /**
     * Subscription expiry date (null for free tier)
     */
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    /**
     * Payment/subscription provider customer ID
     */
    stripeCustomerId: {
      type: String,
      default: null,
    },

    // ==========================================
    // ONBOARDING STATUS
    // ==========================================

    /**
     * Whether user has completed onboarding
     */
    onboardingComplete: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Whether user has completed scenario quiz
     */
    scenarioComplete: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // PROFILE INFO (Basic - detailed in respective profiles)
    // ==========================================

    /**
     * Display name
     */
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    /**
     * Profile photo URL
     */
    profilePhoto: {
      type: String,
      default: null,
    },

    /**
     * User's location (city, country)
     */
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },

    // ==========================================
    // SECURITY & TOKENS
    // ==========================================

    /**
     * Password reset token (hashed)
     */
    passwordResetToken: {
      type: String,
      select: false,
    },

    /**
     * Password reset token expiry
     */
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    /**
     * Last password change timestamp
     */
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    /**
     * Active refresh tokens (for multi-device support)
     * Stores hashed tokens for security
     */
    refreshTokens: {
      type: [{
        token: String,        // Hashed refresh token
        deviceInfo: String,   // Device/browser info
        createdAt: Date,
        expiresAt: Date,
      }],
      select: false,
      default: [],
    },

    /**
     * Failed login attempts counter
     */
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    /**
     * Account lockout time
     */
    lockUntil: {
      type: Date,
      select: false,
    },

    // ==========================================
    // ACTIVITY TRACKING
    // ==========================================

    /**
     * Last login timestamp
     */
    lastLoginAt: {
      type: Date,
      default: null,
    },

    /**
     * Last activity timestamp
     */
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * Total login count
     */
    loginCount: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // VERIFICATION & BADGES
    // ==========================================

    /**
     * Whether user is verified (admin verified)
     */
    isVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Verification date
     */
    verifiedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // PREFERENCES
    // ==========================================

    /**
     * Email notification preferences
     */
    emailNotifications: {
      type: Boolean,
      default: true,
    },

    /**
     * Push notification preferences
     */
    pushNotifications: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // ADMIN FIELDS
    // ==========================================

    /**
     * Admin notes (only visible to admins)
     */
    adminNotes: {
      type: String,
      select: false,
    },

    /**
     * Suspension reason (if suspended)
     */
    suspensionReason: {
      type: String,
      default: null,
    },

    /**
     * Ban reason (if banned)
     */
    banReason: {
      type: String,
      default: null,
    },
  },
  {
    // ==========================================
    // SCHEMA OPTIONS
    // ==========================================
    
    timestamps: true, // Adds createdAt and updatedAt
    
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.passwordChangedAt;
        delete ret.refreshTokens;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.adminNotes;
        delete ret.__v;
        return ret;
      },
    },
    
    toObject: {
      virtuals: true,
    },
  }
);

// ============================================
// INDEXES
// ============================================

// Compound indexes for common queries
userSchema.index({ userType: 1, status: 1 });
userSchema.index({ subscriptionTier: 1, subscriptionExpiresAt: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// Text index for search
userSchema.index({ name: 'text', phone: 'text' });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Virtual field: Check if subscription is active
 */
userSchema.virtual('isSubscriptionActive').get(function () {
  if (this.subscriptionTier === SUBSCRIPTION_TIERS.FREE) {
    return true; // Free tier is always "active"
  }
  return this.subscriptionExpiresAt && this.subscriptionExpiresAt > new Date();
});

/**
 * Virtual field: Check if account is locked
 */
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

/**
 * Virtual field: Is founder
 */
userSchema.virtual('isFounder').get(function () {
  return this.userType === USER_TYPES.FOUNDER;
});

/**
 * Virtual field: Is builder
 */
userSchema.virtual('isBuilder').get(function () {
  return this.userType === USER_TYPES.BUILDER;
});

/**
 * Virtual field: Is admin
 */
userSchema.virtual('isAdmin').get(function () {
  return this.userType === USER_TYPES.ADMIN;
});

/**
 * Virtual field: Has premium features
 */
userSchema.virtual('isPremium').get(function () {
  const premiumTiers = [SUBSCRIPTION_TIERS.FOUNDER_PRO, SUBSCRIPTION_TIERS.BUILDER_BOOST];
  return premiumTiers.includes(this.subscriptionTier) && this.isSubscriptionActive;
});

// Add to VIRTUAL FIELDS section:

/**
 * Virtual field: Has both profiles (can act as either)
 */
userSchema.virtual('hasDualProfile').get(function () {
    return !!(this.founderProfile && this.builderProfile);
  });
  
  /**
   * Virtual field: Can switch roles
   */
  userSchema.virtual('canSwitchRoles').get(function () {
    return this.hasDualProfile;
  });
  
  // Add to INSTANCE METHODS section:
  
  /**
   * Switch active role
   * @param {string} role - 'FOUNDER' or 'BUILDER'
   * @returns {Promise<User>}
   */
  userSchema.methods.switchRole = async function (role) {
    if (!['FOUNDER', 'BUILDER'].includes(role)) {
      throw new Error('Invalid role');
    }
    
    if (role === 'FOUNDER' && !this.founderProfile) {
      throw new Error('No founder profile exists');
    }
    
    if (role === 'BUILDER' && !this.builderProfile) {
      throw new Error('No builder profile exists');
    }
    
    this.activeRole = role;
    return this.save();
  };

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Remove null/empty email to allow sparse unique index to work
 * Sparse indexes only skip documents where the field is MISSING,
 * not where it's explicitly set to null
 */
userSchema.pre('save', function (next) {
  if (this.email === null || this.email === undefined || this.email === '') {
    this.email = undefined; // Remove the field entirely
  }
  next();
});

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Update passwordChangedAt (except for new documents)
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is always created after password change
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Update lastActiveAt on save
 */
userSchema.pre('save', function (next) {
  this.lastActiveAt = new Date();
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Compare password with stored hash
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Check if password was changed after a given timestamp
 * Used to invalidate tokens after password change
 * @param {number} timestamp - JWT iat timestamp
 * @returns {boolean} True if password was changed after timestamp
 */
userSchema.methods.changedPasswordAfter = function (timestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return timestamp < changedTimestamp;
  }
  return false;
};

/**
 * Check if user can perform an action based on subscription
 * @param {string} feature - Feature to check
 * @returns {boolean} True if user has access
 */
userSchema.methods.hasFeatureAccess = function (feature) {
  const { config } = require('../../../shared/config');
  
  const tier = this.subscriptionTier;
  const features = config.subscription[tier.toLowerCase()]?.features || {};
  
  return features[feature] === true || features[feature] > 0;
};

/**
 * Get daily match limit based on subscription
 * @returns {number} Daily match limit
 */
userSchema.methods.getDailyMatchLimit = function () {
  const { config } = require('../../../shared/config');
  
  switch (this.subscriptionTier) {
    case SUBSCRIPTION_TIERS.FOUNDER_PRO:
      return config.matching.dailyLimits.pro;
    case SUBSCRIPTION_TIERS.BUILDER_BOOST:
      return config.matching.dailyLimits.boost;
    default:
      return config.matching.dailyLimits.free;
  }
};

/**
 * Increment login attempts and lock if necessary
 * @returns {Promise<void>}
 */
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

  // If we have a previous lock that has expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've reached max attempts
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

/**
 * Reset login attempts after successful login
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Record successful login
 * @returns {Promise<void>}
 */
userSchema.methods.recordLogin = async function () {
  return this.updateOne({
    $set: {
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
      loginAttempts: 0,
    },
    $inc: { loginCount: 1 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Update last active timestamp
 * @returns {Promise<void>}
 */
userSchema.methods.updateLastActive = async function () {
  return this.updateOne({
    $set: { lastActiveAt: new Date() },
  });
};

/**
 * Get public profile data (safe to expose)
 * @returns {Object} Public profile data
 */
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    profilePhoto: this.profilePhoto,
    userType: this.userType,
    location: this.location,
    isVerified: this.isVerified,
    onboardingComplete: this.onboardingComplete,
    createdAt: this.createdAt,
  };
};

/**
 * Get safe user data for API responses
 * @returns {Object} Safe user data
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    email: this.email,
    phone: this.phone,
    name: this.name,
    profilePhoto: this.profilePhoto,
    userType: this.userType,
    status: this.status,
    subscriptionTier: this.subscriptionTier,
    isSubscriptionActive: this.isSubscriptionActive,
    onboardingComplete: this.onboardingComplete,
    scenarioComplete: this.scenarioComplete,
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified,
    isVerified: this.isVerified,
    location: this.location,
    emailNotifications: this.emailNotifications,
    pushNotifications: this.pushNotifications,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find user by email
 * @param {string} email - User's email
 * @param {boolean} includePassword - Include password in result
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmail = function (email, includePassword = false) {
  const query = this.findOne({ email: email.toLowerCase() });
  if (includePassword) {
    query.select('+password');
  }
  return query;
};

/**
 * Find user by phone
 * @param {string} phone - User's phone number
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phone });
};

/**
 * Find user by email or phone
 * @param {string} emailOrPhone - Email or phone number
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmailOrPhone = function (emailOrPhone) {
  return this.findOne({
    $or: [
      { email: emailOrPhone.toLowerCase() },
      { phone: emailOrPhone },
    ],
  });
};

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>}
 */
userSchema.statics.emailExists = async function (email) {
  const count = await this.countDocuments({ email: email.toLowerCase() });
  return count > 0;
};

/**
 * Check if phone exists
 * @param {string} phone - Phone to check
 * @returns {Promise<boolean>}
 */
userSchema.statics.phoneExists = async function (phone) {
  const count = await this.countDocuments({ phone });
  return count > 0;
};

/**
 * Get active users count by type
 * @returns {Promise<Object>} Count by user type
 */
userSchema.statics.getActiveUserCounts = async function () {
  const result = await this.aggregate([
    { $match: { status: USER_STATUS.ACTIVE } },
    { $group: { _id: '$userType', count: { $sum: 1 } } },
  ]);

  return result.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Get users with expiring subscriptions
 * @param {number} daysUntilExpiry - Days until subscription expires
 * @returns {Promise<User[]>}
 */
userSchema.statics.getExpiringSubscriptions = function (daysUntilExpiry = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  return this.find({
    subscriptionTier: { $ne: SUBSCRIPTION_TIERS.FREE },
    subscriptionExpiresAt: {
      $lte: expiryDate,
      $gte: new Date(),
    },
    status: USER_STATUS.ACTIVE,
  });
};

// ============================================
// MODEL EXPORT
// ============================================

const User = mongoose.model('User', userSchema);

module.exports = User;
