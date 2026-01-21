/**
 * @fileoverview FounderProfile model - Detailed founder/startup information
 * 
 * Stores:
 * - Startup details (name, stage, description)
 * - Founder commitment and team status
 * - Compensation offerings (equity, cash)
 * - Roles seeking
 * - Intent statement
 * - Risk disclosures
 * 
 * @module models/FounderProfile
 */

const mongoose = require('mongoose');
const {
  STARTUP_STAGES,
  ROLE_TYPES,
  VESTING_TYPES,
  REMOTE_PREFERENCES,
  CURRENCIES,
} = require('../../../shared/constants');

const { Schema } = mongoose;

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Compensation range sub-schema
 * Used for both equity and cash ranges
 */
const rangeSchema = new Schema(
  {
    min: {
      type: Number,
      required: true,
      min: [0, 'Minimum cannot be negative'],
    },
    max: {
      type: Number,
      required: true,
      min: [0, 'Maximum cannot be negative'],
    },
  },
  { _id: false }
);

/**
 * Social links sub-schema
 */
const socialLinksSchema = new Schema(
  {
    linkedin: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i,
        'Please provide a valid LinkedIn URL',
      ],
    },
    twitter: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.*$/i,
        'Please provide a valid Twitter/X URL',
      ],
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}.*$/,
        'Please provide a valid website URL',
      ],
    },
    productUrl: {
      type: String,
      trim: true,
    },
    pitchDeck: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMA
// ============================================

const founderProfileSchema = new Schema(
  {
    // ==========================================
    // USER REFERENCE
    // ==========================================

    /**
     * Reference to the User document
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },

    // ==========================================
    // STARTUP INFORMATION
    // ==========================================

    /**
     * Startup/Company name (optional at early stage)
     */
    startupName: {
      type: String,
      trim: true,
      maxlength: [100, 'Startup name cannot exceed 100 characters'],
      index: true,
    },

    /**
     * One-line description of the startup
     */
    tagline: {
      type: String,
      trim: true,
      maxlength: [150, 'Tagline cannot exceed 150 characters'],
    },

    /**
     * Detailed description of what the startup does
     */
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    /**
     * Current stage of the startup
     */
    startupStage: {
      type: String,
      enum: {
        values: Object.values(STARTUP_STAGES),
        message: 'Invalid startup stage',
      },
      required: [true, 'Startup stage is required'],
      index: true,
    },

    /**
     * Industry/Domain of the startup
     */
    industry: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 3;
        },
        message: 'Maximum 3 industries allowed',
      },
    },

    /**
     * Problem the startup is solving
     */
    problemStatement: {
      type: String,
      trim: true,
      maxlength: [1000, 'Problem statement cannot exceed 1000 characters'],
    },

    /**
     * Target market/customers
     */
    targetMarket: {
      type: String,
      trim: true,
      maxlength: [500, 'Target market cannot exceed 500 characters'],
    },

    // ==========================================
    // FOUNDER COMMITMENT
    // ==========================================

    /**
     * Hours per week the founder commits
     */
    hoursPerWeek: {
      type: Number,
      required: [true, 'Hours per week is required'],
      min: [5, 'Minimum 5 hours per week'],
      max: [80, 'Maximum 80 hours per week'],
    },

    /**
     * Whether the founder is working solo
     */
    isSolo: {
      type: Boolean,
      required: true,
      default: true,
    },

    /**
     * Number of existing co-founders (if not solo)
     */
    existingCofounderCount: {
      type: Number,
      default: 0,
      min: [0, 'Co-founder count cannot be negative'],
      max: [10, 'Maximum 10 co-founders'],
    },

    /**
     * Whether founder is full-time on this startup
     */
    isFullTime: {
      type: Boolean,
      default: false,
    },

    /**
     * Current employment status
     */
    currentStatus: {
      type: String,
      enum: ['FULL_TIME_STARTUP', 'EMPLOYED_TRANSITIONING', 'STUDENT', 'FREELANCE', 'OTHER'],
      default: 'OTHER',
    },

    // ==========================================
    // ROLES SEEKING
    // ==========================================

    /**
     * Types of roles the founder is looking to fill
     */
    rolesSeeking: {
      type: [{
        type: String,
        enum: {
          values: Object.values(ROLE_TYPES),
          message: 'Invalid role type',
        },
      }],
      required: [true, 'At least one role type is required'],
      validate: {
        validator: function (v) {
          return v.length > 0 && v.length <= 4;
        },
        message: 'Select between 1 and 4 role types',
      },
    },

    /**
     * Specific skills/roles needed (e.g., "Full-stack Developer", "Growth Lead")
     */
    specificRolesNeeded: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'Maximum 10 specific roles allowed',
      },
    },

    /**
     * Skills the founder is looking for
     */
    skillsNeeded: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 15;
        },
        message: 'Maximum 15 skills allowed',
      },
      index: true,
    },

    // ==========================================
    // COMPENSATION DISCLOSURE (MANDATORY)
    // ==========================================

    /**
     * Equity percentage range offered
     * e.g., { min: 1, max: 5 } means 1-5%
     */
    equityRange: {
      type: rangeSchema,
      required: [true, 'Equity range is required'],
      validate: {
        validator: function (v) {
          return v.min <= v.max && v.max <= 100;
        },
        message: 'Invalid equity range',
      },
    },

    /**
     * Monthly cash/stipend range offered
     * e.g., { min: 0, max: 50000 } means ₹0-50K
     */
    cashRange: {
      type: rangeSchema,
      required: [true, 'Cash range is required'],
      validate: {
        validator: function (v) {
          return v.min <= v.max;
        },
        message: 'Minimum cash cannot be greater than maximum',
      },
    },

    /**
     * Currency for cash compensation
     */
    cashCurrency: {
      type: String,
      enum: {
        values: Object.values(CURRENCIES),
        message: 'Invalid currency',
      },
      default: CURRENCIES.INR,
    },

    /**
     * Vesting schedule type
     */
    vestingType: {
      type: String,
      enum: {
        values: Object.values(VESTING_TYPES),
        message: 'Invalid vesting type',
      },
      required: [true, 'Vesting type is required'],
    },

    /**
     * Custom vesting details (if vestingType is CUSTOM)
     */
    vestingDetails: {
      type: String,
      trim: true,
      maxlength: [500, 'Vesting details cannot exceed 500 characters'],
    },

    /**
     * Additional compensation notes
     */
    compensationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Compensation notes cannot exceed 500 characters'],
    },

    // ==========================================
    // RISK DISCLOSURE (MANDATORY)
    // ==========================================

    /**
     * Risk acknowledgment checkboxes
     * All must be true for profile to be complete
     */
    riskDisclosure: {
      uncertaintyAcknowledged: {
        type: Boolean,
        default: false,
      },
      failurePossibilityAcknowledged: {
        type: Boolean,
        default: false,
      },
      trialOpenness: {
        type: Boolean,
        default: false,
      },
    },

    // ==========================================
    // INTENT STATEMENT
    // ==========================================

    /**
     * Why should someone build this with you?
     * This is a key matching field
     */
    intentStatement: {
      type: String,
      trim: true,
      required: [true, 'Intent statement is required'],
      minlength: [50, 'Intent statement must be at least 50 characters'],
      maxlength: [300, 'Intent statement cannot exceed 300 characters'],
    },

    // ==========================================
    // LOCATION & PREFERENCES
    // ==========================================

    /**
     * Primary location (city, country)
     */
    location: {
      city: {
        type: String,
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters'],
      },
      country: {
        type: String,
        trim: true,
        maxlength: [100, 'Country cannot exceed 100 characters'],
      },
      timezone: {
        type: String,
        trim: true,
      },
    },

    /**
     * Remote work preference
     */
    remotePreference: {
      type: String,
      enum: {
        values: Object.values(REMOTE_PREFERENCES),
        message: 'Invalid remote preference',
      },
      required: [true, 'Remote preference is required'],
    },

    /**
     * Open to candidates from specific locations only
     */
    locationPreferences: {
      type: [String],
      default: [],
    },

    // ==========================================
    // SOCIAL & LINKS
    // ==========================================

    /**
     * Social media and other links
     */
    socialLinks: {
      type: socialLinksSchema,
      default: {},
    },

    // ==========================================
    // PROFILE STATUS
    // ==========================================

    /**
     * Whether the profile is complete
     */
    isComplete: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Profile completion percentage
     */
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /**
     * Whether profile is visible in discovery
     */
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * Stealth mode (only visible to matched users)
     */
    stealthMode: {
      type: Boolean,
      default: false,
    },

    /**
     * Admin verification status
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
    // ANALYTICS
    // ==========================================

    /**
     * Number of profile views
     */
    viewCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of interests received
     */
    interestReceivedCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of matches
     */
    matchCount: {
      type: Number,
      default: 0,
    },

    /**
     * Last active date for this profile
     */
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // METADATA
    // ==========================================

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

// Compound indexes for discovery queries
founderProfileSchema.index({ isComplete: 1, isVisible: 1, startupStage: 1 });
founderProfileSchema.index({ rolesSeeking: 1, isVisible: 1 });
founderProfileSchema.index({ skillsNeeded: 1 });
founderProfileSchema.index({ 'location.city': 1, 'location.country': 1 });
founderProfileSchema.index({ remotePreference: 1 });
founderProfileSchema.index({ createdAt: -1 });
founderProfileSchema.index({ lastActiveAt: -1 });

// Text index for search
founderProfileSchema.index({
  startupName: 'text',
  tagline: 'text',
  description: 'text',
  intentStatement: 'text',
});

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if all risk disclosures are acknowledged
 */
founderProfileSchema.virtual('allRisksAcknowledged').get(function () {
  return (
    this.riskDisclosure?.uncertaintyAcknowledged &&
    this.riskDisclosure?.failurePossibilityAcknowledged &&
    this.riskDisclosure?.trialOpenness
  );
});

/**
 * Check if offering equity only (no cash)
 */
founderProfileSchema.virtual('isEquityOnly').get(function () {
  return this.cashRange?.min === 0 && this.cashRange?.max === 0;
});

/**
 * Check if looking for co-founder
 */
founderProfileSchema.virtual('seekingCofounder').get(function () {
  return this.rolesSeeking?.includes(ROLE_TYPES.COFOUNDER);
});

/**
 * Get equity range as formatted string
 */
founderProfileSchema.virtual('equityRangeFormatted').get(function () {
  if (!this.equityRange) return 'Not specified';
  if (this.equityRange.min === this.equityRange.max) {
    return `${this.equityRange.min}%`;
  }
  return `${this.equityRange.min}% - ${this.equityRange.max}%`;
});

/**
 * Get cash range as formatted string
 */
founderProfileSchema.virtual('cashRangeFormatted').get(function () {
  if (!this.cashRange) return 'Not specified';
  
  const formatCash = (amount) => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  const symbol = this.cashCurrency === CURRENCIES.INR ? '₹' :
                 this.cashCurrency === CURRENCIES.AED ? 'AED ' :
                 '$';

  if (this.cashRange.min === 0 && this.cashRange.max === 0) {
    return 'Equity only';
  }
  if (this.cashRange.min === this.cashRange.max) {
    return `${symbol}${formatCash(this.cashRange.min)}/month`;
  }
  return `${symbol}${formatCash(this.cashRange.min)} - ${formatCash(this.cashRange.max)}/month`;
});

/**
 * Get team size (founder + co-founders)
 */
founderProfileSchema.virtual('teamSize').get(function () {
  return 1 + (this.existingCofounderCount || 0);
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Calculate profile completion percentage before save
 */
founderProfileSchema.pre('save', function (next) {
  this.completionPercentage = this.calculateCompletion();
  this.isComplete = this.completionPercentage === 100;
  next();
});

/**
 * Update lastActiveAt on save
 */
founderProfileSchema.pre('save', function (next) {
  this.lastActiveAt = new Date();
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Calculate profile completion percentage
 * @returns {number} Completion percentage (0-100)
 */
founderProfileSchema.methods.calculateCompletion = function () {
  const fields = {
    // Required fields (10 points each = 100 total)
    startupStage: 10,
    hoursPerWeek: 10,
    rolesSeeking: 10,
    equityRange: 10,
    cashRange: 10,
    vestingType: 10,
    intentStatement: 10,
    remotePreference: 10,
    allRisksAcknowledged: 20, // Extra weight for risk acknowledgment
  };

  let score = 0;

  // Check each field
  if (this.startupStage) score += fields.startupStage;
  if (this.hoursPerWeek) score += fields.hoursPerWeek;
  if (this.rolesSeeking?.length > 0) score += fields.rolesSeeking;
  if (this.equityRange?.min !== undefined) score += fields.equityRange;
  if (this.cashRange?.min !== undefined) score += fields.cashRange;
  if (this.vestingType) score += fields.vestingType;
  if (this.intentStatement?.length >= 50) score += fields.intentStatement;
  if (this.remotePreference) score += fields.remotePreference;
  if (this.allRisksAcknowledged) score += fields.allRisksAcknowledged;

  return Math.min(100, score);
};

/**
 * Get data safe for public display
 * @returns {Object} Public profile data
 */
founderProfileSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    startupName: this.startupName,
    tagline: this.tagline,
    description: this.stealthMode ? null : this.description,
    startupStage: this.startupStage,
    industry: this.industry,
    rolesSeeking: this.rolesSeeking,
    skillsNeeded: this.skillsNeeded,
    equityRange: this.equityRange,
    equityRangeFormatted: this.equityRangeFormatted,
    cashRange: this.cashRange,
    cashRangeFormatted: this.cashRangeFormatted,
    cashCurrency: this.cashCurrency,
    vestingType: this.vestingType,
    intentStatement: this.intentStatement,
    location: this.location,
    remotePreference: this.remotePreference,
    hoursPerWeek: this.hoursPerWeek,
    teamSize: this.teamSize,
    isVerified: this.isVerified,
    socialLinks: this.stealthMode ? {} : this.socialLinks,
    createdAt: this.createdAt,
  };
};

/**
 * Get matching data (used by matching algorithm)
 * @returns {Object} Data for matching
 */
founderProfileSchema.methods.getMatchingData = function () {
  return {
    id: this._id,
    userId: this.user,
    startupStage: this.startupStage,
    rolesSeeking: this.rolesSeeking,
    skillsNeeded: this.skillsNeeded,
    equityRange: this.equityRange,
    cashRange: this.cashRange,
    hoursPerWeek: this.hoursPerWeek,
    remotePreference: this.remotePreference,
    location: this.location,
  };
};

/**
 * Increment view count
 * @returns {Promise<void>}
 */
founderProfileSchema.methods.incrementViews = async function () {
  await this.updateOne({ $inc: { viewCount: 1 } });
};

/**
 * Increment interest count
 * @returns {Promise<void>}
 */
founderProfileSchema.methods.incrementInterests = async function () {
  await this.updateOne({ $inc: { interestReceivedCount: 1 } });
};

/**
 * Increment match count
 * @returns {Promise<void>}
 */
founderProfileSchema.methods.incrementMatches = async function () {
  await this.updateOne({ $inc: { matchCount: 1 } });
};

/**
 * Update activity timestamp
 * @returns {Promise<void>}
 */
founderProfileSchema.methods.updateActivity = async function () {
  await this.updateOne({ $set: { lastActiveAt: new Date() } });
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find profile by user ID
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<FounderProfile|null>}
 */
founderProfileSchema.statics.findByUserId = function (userId) {
  return this.findOne({ user: userId });
};

/**
 * Find complete and visible profiles for discovery
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options (pagination, sort)
 * @returns {Promise<FounderProfile[]>}
 */
founderProfileSchema.statics.findForDiscovery = function (filters = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = { lastActiveAt: -1 },
  } = options;

  const query = {
    isComplete: true,
    isVisible: true,
    ...filters,
  };

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name profilePhoto isVerified');
};

/**
 * Find profiles seeking specific role type
 * @param {string} roleType - Role type (COFOUNDER, EMPLOYEE, etc.)
 * @returns {Promise<FounderProfile[]>}
 */
founderProfileSchema.statics.findByRoleSeeking = function (roleType) {
  return this.find({
    isComplete: true,
    isVisible: true,
    rolesSeeking: roleType,
  }).populate('user', 'name profilePhoto isVerified');
};

/**
 * Find profiles needing specific skills
 * @param {string[]} skills - Array of skills
 * @returns {Promise<FounderProfile[]>}
 */
founderProfileSchema.statics.findBySkillsNeeded = function (skills) {
  return this.find({
    isComplete: true,
    isVisible: true,
    skillsNeeded: { $in: skills },
  }).populate('user', 'name profilePhoto isVerified');
};

/**
 * Get active profile count by stage
 * @returns {Promise<Object>} Count by startup stage
 */
founderProfileSchema.statics.getCountByStage = async function () {
  const result = await this.aggregate([
    { $match: { isComplete: true, isVisible: true } },
    { $group: { _id: '$startupStage', count: { $sum: 1 } } },
  ]);

  return result.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Search profiles by text
 * @param {string} searchText - Text to search
 * @param {number} limit - Max results
 * @returns {Promise<FounderProfile[]>}
 */
founderProfileSchema.statics.searchProfiles = function (searchText, limit = 20) {
  return this.find(
    {
      isComplete: true,
      isVisible: true,
      stealthMode: false,
      $text: { $search: searchText },
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('user', 'name profilePhoto isVerified');
};

// ============================================
// MODEL EXPORT
// ============================================

const FounderProfile = mongoose.model('FounderProfile', founderProfileSchema);

module.exports = FounderProfile;
