/**
 * @fileoverview Opening model - Job/role positions created by founders
 * 
 * Represents specific positions founders are hiring for:
 * - Role type (co-founder, employee, intern, fractional)
 * - Compensation details
 * - Skills required
 * - Status management
 * 
 * @module models/Opening
 */

const mongoose = require('mongoose');
const {
  ROLE_TYPES,
  OPENING_STATUS,
  VESTING_TYPES,
  REMOTE_PREFERENCES,
  CURRENCIES,
} = require('../constants');

const { Schema } = mongoose;

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Compensation range sub-schema
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

// ============================================
// MAIN SCHEMA
// ============================================

const openingSchema = new Schema(
  {
    // ==========================================
    // REFERENCES
    // ==========================================

    /**
     * Reference to the founder who created this opening
     */
    founder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Founder reference is required'],
      index: true,
    },

    /**
     * Reference to the founder's profile
     */
    founderProfile: {
      type: Schema.Types.ObjectId,
      ref: 'FounderProfile',
      required: [true, 'Founder profile reference is required'],
      index: true,
    },

    // ==========================================
    // BASIC INFO
    // ==========================================

    /**
     * Opening title (e.g., "Technical Co-founder", "Full-Stack Developer")
     */
    title: {
      type: String,
      required: [true, 'Opening title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: true,
    },

    /**
     * Role type
     */
    roleType: {
      type: String,
      enum: {
        values: Object.values(ROLE_TYPES),
        message: 'Invalid role type',
      },
      required: [true, 'Role type is required'],
      index: true,
    },

    /**
     * Detailed description of the role
     */
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    /**
     * Short summary for cards/previews
     */
    summary: {
      type: String,
      trim: true,
      maxlength: [200, 'Summary cannot exceed 200 characters'],
    },

    // ==========================================
    // REQUIREMENTS
    // ==========================================

    /**
     * Required skills
     */
    skillsRequired: {
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

    /**
     * Nice-to-have skills
     */
    skillsPreferred: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'Maximum 10 preferred skills allowed',
      },
    },

    /**
     * Minimum years of experience required
     */
    experienceRequired: {
      type: Number,
      default: 0,
      min: [0, 'Experience cannot be negative'],
      max: [30, 'Experience cannot exceed 30 years'],
    },

    /**
     * Experience level required
     */
    experienceLevel: {
      type: String,
      enum: ['ANY', 'STUDENT', 'ENTRY', 'MID', 'SENIOR', 'LEAD'],
      default: 'ANY',
    },

    // ==========================================
    // COMPENSATION
    // ==========================================

    /**
     * Equity percentage range offered
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
     */
    cashRange: {
      type: rangeSchema,
      required: [true, 'Cash range is required'],
      validate: {
        validator: function (v) {
          return v.min <= v.max;
        },
        message: 'Invalid cash range',
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
      default: VESTING_TYPES.STANDARD_4Y,
    },

    /**
     * Custom vesting details
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
    // COMMITMENT & AVAILABILITY
    // ==========================================

    /**
     * Hours per week required
     */
    hoursPerWeek: {
      type: Number,
      required: [true, 'Hours per week is required'],
      min: [5, 'Minimum 5 hours per week'],
      max: [80, 'Maximum 80 hours per week'],
    },

    /**
     * Duration expectation
     */
    duration: {
      type: String,
      enum: ['SHORT_TERM', 'LONG_TERM', 'FLEXIBLE', 'PERMANENT'],
      default: 'LONG_TERM',
    },

    /**
     * When the role should start
     */
    startDate: {
      type: String,
      enum: ['IMMEDIATELY', 'WITHIN_2_WEEKS', 'WITHIN_MONTH', 'FLEXIBLE'],
      default: 'FLEXIBLE',
    },

    // ==========================================
    // LOCATION & REMOTE
    // ==========================================

    /**
     * Remote work preference for this role
     */
    remotePreference: {
      type: String,
      enum: {
        values: Object.values(REMOTE_PREFERENCES),
        message: 'Invalid remote preference',
      },
      default: REMOTE_PREFERENCES.REMOTE,
    },

    /**
     * Office/work location (if not fully remote)
     */
    location: {
      city: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },

    /**
     * Timezone preferences
     */
    timezonePreference: {
      type: String,
      trim: true,
      maxlength: [100, 'Timezone preference cannot exceed 100 characters'],
    },

    // ==========================================
    // STATUS & VISIBILITY
    // ==========================================

    /**
     * Current status of the opening
     */
    status: {
      type: String,
      enum: {
        values: Object.values(OPENING_STATUS),
        message: 'Invalid opening status',
      },
      default: OPENING_STATUS.ACTIVE,
      index: true,
    },

    /**
     * Whether opening is visible in discovery
     */
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * Featured/promoted opening
     */
    isFeatured: {
      type: Boolean,
      default: false,
    },

    /**
     * Priority order for founder's listings
     */
    priority: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // RISK APPETITE PREFERENCE
    // ==========================================

    /**
     * Preferred risk appetite of candidates
     * Used for matching with builders
     */
    preferredRiskAppetite: {
      type: [String],
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: ['MEDIUM', 'HIGH'],
    },

    // ==========================================
    // APPLICATION SETTINGS
    // ==========================================

    /**
     * Whether to accept new interests
     */
    acceptingInterests: {
      type: Boolean,
      default: true,
    },

    /**
     * Maximum interests to accept (0 = unlimited)
     */
    maxInterests: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Custom questions for applicants
     */
    customQuestions: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 custom questions allowed',
      },
    },

    // ==========================================
    // ANALYTICS
    // ==========================================

    /**
     * Number of views
     */
    viewCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of interests received
     */
    interestCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of shortlisted candidates
     */
    shortlistCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of conversations started
     */
    conversationCount: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // DATES
    // ==========================================

    /**
     * When the opening was published
     */
    publishedAt: {
      type: Date,
      default: null,
    },

    /**
     * When the opening was closed
     */
    closedAt: {
      type: Date,
      default: null,
    },

    /**
     * When the opening was filled
     */
    filledAt: {
      type: Date,
      default: null,
    },

    /**
     * Last activity on this opening
     */
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // FILLED BY (when position is filled)
    // ==========================================

    /**
     * Builder who filled the position
     */
    filledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ==========================================
    // METADATA
    // ==========================================

    /**
     * Tags for categorization
     */
    tags: {
      type: [String],
      default: [],
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

// Compound indexes for discovery
openingSchema.index({ status: 1, isVisible: 1, roleType: 1 });
openingSchema.index({ founder: 1, status: 1 });
openingSchema.index({ skillsRequired: 1 });
openingSchema.index({ 'location.city': 1, 'location.country': 1 });
openingSchema.index({ remotePreference: 1 });
openingSchema.index({ createdAt: -1 });
openingSchema.index({ lastActivityAt: -1 });
openingSchema.index({ publishedAt: -1 });

// Text index for search
openingSchema.index({
  title: 'text',
  description: 'text',
  skillsRequired: 'text',
});

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if opening is active and accepting interests
 */
openingSchema.virtual('isOpen').get(function () {
  return (
    this.status === OPENING_STATUS.ACTIVE &&
    this.isVisible &&
    this.acceptingInterests
  );
});

/**
 * Check if opening is equity-only
 */
openingSchema.virtual('isEquityOnly').get(function () {
  return this.cashRange?.min === 0 && this.cashRange?.max === 0;
});

/**
 * Check if opening is for co-founder role
 */
openingSchema.virtual('isCofounderRole').get(function () {
  return this.roleType === ROLE_TYPES.COFOUNDER;
});

/**
 * Get equity range as formatted string
 */
openingSchema.virtual('equityRangeFormatted').get(function () {
  if (!this.equityRange) return 'Not specified';
  if (this.equityRange.min === this.equityRange.max) {
    return `${this.equityRange.min}%`;
  }
  return `${this.equityRange.min}% - ${this.equityRange.max}%`;
});

/**
 * Get cash range as formatted string
 */
openingSchema.virtual('cashRangeFormatted').get(function () {
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

  const symbol =
    this.cashCurrency === CURRENCIES.INR ? '₹' :
    this.cashCurrency === CURRENCIES.AED ? 'AED ' : '$';

  if (this.cashRange.min === 0 && this.cashRange.max === 0) {
    return 'Equity only';
  }
  if (this.cashRange.min === this.cashRange.max) {
    return `${symbol}${formatCash(this.cashRange.min)}/month`;
  }
  return `${symbol}${formatCash(this.cashRange.min)} - ${formatCash(this.cashRange.max)}/month`;
});

/**
 * Get commitment level description
 */
openingSchema.virtual('commitmentLevel').get(function () {
  if (this.hoursPerWeek >= 40) return 'Full-time';
  if (this.hoursPerWeek >= 30) return 'Part-time+';
  if (this.hoursPerWeek >= 20) return 'Part-time';
  if (this.hoursPerWeek >= 10) return 'Limited';
  return 'Minimal';
});

/**
 * Check if max interests reached
 */
openingSchema.virtual('isMaxInterestsReached').get(function () {
  if (this.maxInterests === 0) return false;
  return this.interestCount >= this.maxInterests;
});

/**
 * Days since published
 */
openingSchema.virtual('daysSincePublished').get(function () {
  if (!this.publishedAt) return null;
  return Math.floor((new Date() - this.publishedAt) / (1000 * 60 * 60 * 24));
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Update timestamps and status on save
 */
openingSchema.pre('save', function (next) {
  // Set publishedAt when first activated
  if (
    this.isModified('status') &&
    this.status === OPENING_STATUS.ACTIVE &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // Set closedAt when closed
  if (
    this.isModified('status') &&
    this.status === OPENING_STATUS.CLOSED &&
    !this.closedAt
  ) {
    this.closedAt = new Date();
  }

  // Set filledAt when filled
  if (
    this.isModified('status') &&
    this.status === OPENING_STATUS.FILLED &&
    !this.filledAt
  ) {
    this.filledAt = new Date();
  }

  // Update lastActivityAt
  this.lastActivityAt = new Date();

  next();
});

/**
 * Generate summary from description if not provided
 */
openingSchema.pre('save', function (next) {
  if (!this.summary && this.description) {
    this.summary = this.description.substring(0, 197) + '...';
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Get public data for discovery/cards
 * @returns {Object} Public opening data
 */
openingSchema.methods.getPublicData = function () {
  return {
    id: this._id,
    title: this.title,
    roleType: this.roleType,
    summary: this.summary,
    skillsRequired: this.skillsRequired,
    equityRange: this.equityRange,
    equityRangeFormatted: this.equityRangeFormatted,
    cashRange: this.cashRange,
    cashRangeFormatted: this.cashRangeFormatted,
    cashCurrency: this.cashCurrency,
    hoursPerWeek: this.hoursPerWeek,
    commitmentLevel: this.commitmentLevel,
    remotePreference: this.remotePreference,
    location: this.location,
    isEquityOnly: this.isEquityOnly,
    isCofounderRole: this.isCofounderRole,
    status: this.status,
    publishedAt: this.publishedAt,
    daysSincePublished: this.daysSincePublished,
  };
};

/**
 * Get full data for detail view
 * @returns {Object} Full opening data
 */
openingSchema.methods.getFullData = function () {
  return {
    ...this.getPublicData(),
    description: this.description,
    skillsPreferred: this.skillsPreferred,
    experienceRequired: this.experienceRequired,
    experienceLevel: this.experienceLevel,
    vestingType: this.vestingType,
    vestingDetails: this.vestingDetails,
    compensationNotes: this.compensationNotes,
    duration: this.duration,
    startDate: this.startDate,
    timezonePreference: this.timezonePreference,
    preferredRiskAppetite: this.preferredRiskAppetite,
    customQuestions: this.customQuestions,
    interestCount: this.interestCount,
    isOpen: this.isOpen,
  };
};

/**
 * Get matching data for algorithm
 * @returns {Object} Data for matching
 */
openingSchema.methods.getMatchingData = function () {
  return {
    id: this._id,
    founderId: this.founder,
    roleType: this.roleType,
    skillsRequired: this.skillsRequired,
    equityRange: this.equityRange,
    cashRange: this.cashRange,
    hoursPerWeek: this.hoursPerWeek,
    remotePreference: this.remotePreference,
    location: this.location,
    preferredRiskAppetite: this.preferredRiskAppetite,
    experienceRequired: this.experienceRequired,
  };
};

/**
 * Check if a builder matches this opening
 * @param {Object} builderProfile - Builder's profile data
 * @returns {Object} Match result
 */
openingSchema.methods.checkBuilderMatch = function (builderProfile) {
  const result = {
    isMatch: true,
    score: 0,
    reasons: [],
  };

  // Check role interest
  if (!builderProfile.rolesInterested?.includes(this.roleType)) {
    result.isMatch = false;
    result.reasons.push('Builder not interested in this role type');
  }

  // Check compensation compatibility
  if (this.isEquityOnly && !builderProfile.acceptsEquityOnly) {
    result.isMatch = false;
    result.reasons.push('Opening is equity-only, builder requires cash');
  }

  // Check hours compatibility
  if (builderProfile.hoursPerWeek < this.hoursPerWeek * 0.5) {
    result.isMatch = false;
    result.reasons.push('Insufficient availability');
  }

  // Check risk appetite
  if (
    this.preferredRiskAppetite?.length > 0 &&
    !this.preferredRiskAppetite.includes(builderProfile.riskAppetite)
  ) {
    result.reasons.push('Risk appetite mismatch');
  }

  // Calculate skill match
  const matchedSkills = this.skillsRequired.filter((skill) =>
    builderProfile.skills?.includes(skill)
  );
  const skillMatchPercentage =
    this.skillsRequired.length > 0
      ? Math.round((matchedSkills.length / this.skillsRequired.length) * 100)
      : 100;

  result.skillMatch = {
    matched: matchedSkills,
    percentage: skillMatchPercentage,
  };

  if (skillMatchPercentage < 30) {
    result.isMatch = false;
    result.reasons.push('Insufficient skill match');
  }

  return result;
};

/**
 * Increment view count
 */
openingSchema.methods.incrementViews = async function () {
  await this.updateOne({ $inc: { viewCount: 1 } });
};

/**
 * Increment interest count
 */
openingSchema.methods.incrementInterests = async function () {
  await this.updateOne({
    $inc: { interestCount: 1 },
    $set: { lastActivityAt: new Date() },
  });
};

/**
 * Increment shortlist count
 */
openingSchema.methods.incrementShortlists = async function () {
  await this.updateOne({ $inc: { shortlistCount: 1 } });
};

/**
 * Increment conversation count
 */
openingSchema.methods.incrementConversations = async function () {
  await this.updateOne({ $inc: { conversationCount: 1 } });
};

/**
 * Pause the opening
 */
openingSchema.methods.pause = async function () {
  this.status = OPENING_STATUS.PAUSED;
  this.acceptingInterests = false;
  return this.save();
};

/**
 * Activate/Resume the opening
 */
openingSchema.methods.activate = async function () {
  this.status = OPENING_STATUS.ACTIVE;
  this.acceptingInterests = true;
  return this.save();
};

/**
 * Close the opening
 */
openingSchema.methods.close = async function () {
  this.status = OPENING_STATUS.CLOSED;
  this.acceptingInterests = false;
  this.closedAt = new Date();
  return this.save();
};

/**
 * Mark as filled
 * @param {ObjectId} builderId - ID of the builder who filled the position
 */
openingSchema.methods.markFilled = async function (builderId) {
  this.status = OPENING_STATUS.FILLED;
  this.acceptingInterests = false;
  this.filledAt = new Date();
  this.filledBy = builderId;
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find opening by ID with founder populated
 * @param {ObjectId} openingId - Opening ID
 * @returns {Promise<Opening|null>}
 */
openingSchema.statics.findByIdWithFounder = function (openingId) {
  return this.findById(openingId)
    .populate('founder', 'name profilePhoto isVerified')
    .populate('founderProfile', 'startupName tagline startupStage');
};

/**
 * Find openings by founder
 * @param {ObjectId} founderId - Founder's user ID
 * @param {string} [status] - Filter by status
 * @returns {Promise<Opening[]>}
 */
openingSchema.statics.findByFounder = function (founderId, status = null) {
  const query = { founder: founderId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ priority: -1, createdAt: -1 });
};

/**
 * Find active openings for discovery
 * @param {Object} filters - Query filters
 * @param {Object} options - Pagination options
 * @returns {Promise<Opening[]>}
 */
openingSchema.statics.findForDiscovery = function (filters = {}, options = {}) {
  const { page = 1, limit = 10, sort = { publishedAt: -1 } } = options;

  const query = {
    status: OPENING_STATUS.ACTIVE,
    isVisible: true,
    acceptingInterests: true,
    ...filters,
  };

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('founder', 'name profilePhoto isVerified')
    .populate('founderProfile', 'startupName tagline startupStage location');
};

/**
 * Find openings by role type
 * @param {string} roleType - Role type
 * @param {Object} options - Query options
 * @returns {Promise<Opening[]>}
 */
openingSchema.statics.findByRoleType = function (roleType, options = {}) {
  return this.findForDiscovery({ roleType }, options);
};

/**
 * Find openings by skills
 * @param {string[]} skills - Skills to match
 * @param {Object} options - Query options
 * @returns {Promise<Opening[]>}
 */
openingSchema.statics.findBySkills = function (skills, options = {}) {
  return this.findForDiscovery(
    { skillsRequired: { $in: skills } },
    options
  );
};

/**
 * Find equity-only openings
 * @param {Object} options - Query options
 * @returns {Promise<Opening[]>}
 */
openingSchema.statics.findEquityOnly = function (options = {}) {
  return this.findForDiscovery(
    {
      'cashRange.min': 0,
      'cashRange.max': 0,
    },
    options
  );
};

/**
 * Find openings for high-risk builders
 * @param {Object} options - Query options
 * @returns {Promise<Opening[]>}
 */
openingSchema.statics.findForHighRiskBuilders = function (options = {}) {
  return this.findForDiscovery(
    {
      preferredRiskAppetite: 'HIGH',
    },
    options
  );
};

/**
 * Search openings by text
 * @param {string} searchText - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Opening[]>}
 */
openingSchema.statics.searchOpenings = function (searchText, limit = 20) {
  return this.find(
    {
      status: OPENING_STATUS.ACTIVE,
      isVisible: true,
      $text: { $search: searchText },
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('founder', 'name profilePhoto isVerified')
    .populate('founderProfile', 'startupName tagline startupStage');
};

/**
 * Get opening statistics for a founder
 * @param {ObjectId} founderId - Founder's user ID
 * @returns {Promise<Object>} Statistics
 */
openingSchema.statics.getFounderStats = async function (founderId) {
  const stats = await this.aggregate([
    { $match: { founder: new mongoose.Types.ObjectId(founderId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalInterests: { $sum: '$interestCount' },
      },
    },
  ]);

  return stats.reduce(
    (acc, { _id, count, totalViews, totalInterests }) => {
      acc.byStatus[_id] = count;
      acc.totalViews += totalViews;
      acc.totalInterests += totalInterests;
      return acc;
    },
    { byStatus: {}, totalViews: 0, totalInterests: 0 }
  );
};

/**
 * Get count by role type
 * @returns {Promise<Object>} Count by role type
 */
openingSchema.statics.getCountByRoleType = async function () {
  const result = await this.aggregate([
    {
      $match: {
        status: OPENING_STATUS.ACTIVE,
        isVisible: true,
      },
    },
    { $group: { _id: '$roleType', count: { $sum: 1 } } },
  ]);

  return result.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Count active openings for a founder
 * @param {ObjectId} founderId - Founder's user ID
 * @returns {Promise<number>}
 */
openingSchema.statics.countActiveByFounder = function (founderId) {
  return this.countDocuments({
    founder: founderId,
    status: OPENING_STATUS.ACTIVE,
  });
};

// ============================================
// MODEL EXPORT
// ============================================

const Opening = mongoose.model('Opening', openingSchema);

module.exports = Opening;