/**
 * @fileoverview Interest model - Builder interest in openings
 * 
 * Tracks when builders express interest in founder openings:
 * - Interest status lifecycle
 * - Custom question answers
 * - Timestamps for each action
 * - Compatibility scores
 * 
 * @module models/Interest
 */

const mongoose = require('mongoose');
const { INTEREST_STATUS } = require('../../../shared/constants');

const { Schema } = mongoose;

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Custom question answer sub-schema
 */
const questionAnswerSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
      maxlength: [500, 'Answer cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

/**
 * Status history entry sub-schema
 */
const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters'],
    },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMA
// ============================================

const interestSchema = new Schema(
  {
    // ==========================================
    // REFERENCES
    // ==========================================

    /**
     * The builder expressing interest
     */
    builder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Builder reference is required'],
      index: true,
    },

    /**
     * Builder's profile
     */
    builderProfile: {
      type: Schema.Types.ObjectId,
      ref: 'BuilderProfile',
      required: [true, 'Builder profile reference is required'],
    },

    /**
     * The opening being interested in
     */
    opening: {
      type: Schema.Types.ObjectId,
      ref: 'Opening',
      required: [true, 'Opening reference is required'],
      index: true,
    },

    /**
     * The founder who owns the opening
     */
    founder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Founder reference is required'],
      index: true,
    },

    // ==========================================
    // STATUS
    // ==========================================

    /**
     * Current status of the interest
     */
    status: {
      type: String,
      enum: {
        values: Object.values(INTEREST_STATUS),
        message: 'Invalid interest status',
      },
      default: INTEREST_STATUS.INTERESTED,
      index: true,
    },

    /**
     * Status change history
     */
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // ==========================================
    // BUILDER'S INTEREST DETAILS
    // ==========================================

    /**
     * Builder's message/cover note
     */
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    /**
     * Answers to founder's custom questions
     */
    questionAnswers: {
      type: [questionAnswerSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 question answers allowed',
      },
    },

    /**
     * Builder's expected compensation (if different from profile)
     */
    expectedCompensation: {
      equityMin: { type: Number },
      equityMax: { type: Number },
      cashMin: { type: Number },
      cashMax: { type: Number },
      notes: { type: String, maxlength: 200 },
    },

    /**
     * Builder's availability for this specific role
     */
    availability: {
      hoursPerWeek: { type: Number },
      startDate: { type: String },
      notes: { type: String, maxlength: 200 },
    },

    // ==========================================
    // FOUNDER'S RESPONSE
    // ==========================================

    /**
     * Founder's internal notes (not visible to builder)
     */
    founderNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    /**
     * Founder's rating of the candidate (1-5)
     */
    founderRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    /**
     * Reason for passing (if status is PASSED)
     */
    passReason: {
      type: String,
      enum: [
        'SKILLS_MISMATCH',
        'EXPERIENCE_MISMATCH',
        'COMPENSATION_MISMATCH',
        'AVAILABILITY_MISMATCH',
        'CULTURE_FIT',
        'POSITION_FILLED',
        'OTHER',
      ],
      default: null,
    },

    /**
     * Detailed pass feedback (optional)
     */
    passFeedback: {
      type: String,
      trim: true,
      maxlength: [300, 'Feedback cannot exceed 300 characters'],
    },

    // ==========================================
    // MATCHING DATA
    // ==========================================

    /**
     * Compatibility score at time of interest
     */
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    /**
     * Detailed compatibility breakdown
     */
    compatibilityBreakdown: {
      skills: { type: Number },
      compensation: { type: Number },
      commitment: { type: Number },
      riskAppetite: { type: Number },
      scenario: { type: Number },
      location: { type: Number },
    },

    /**
     * Scenario compatibility score (if both completed)
     */
    scenarioCompatibility: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // ==========================================
    // TIMESTAMPS
    // ==========================================

    /**
     * When interest was expressed
     */
    interestedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * When founder viewed this interest
     */
    viewedAt: {
      type: Date,
      default: null,
    },

    /**
     * When founder shortlisted
     */
    shortlistedAt: {
      type: Date,
      default: null,
    },

    /**
     * When matched (mutual interest)
     */
    matchedAt: {
      type: Date,
      default: null,
    },

    /**
     * When passed by founder
     */
    passedAt: {
      type: Date,
      default: null,
    },

    /**
     * When withdrawn by builder
     */
    withdrawnAt: {
      type: Date,
      default: null,
    },

    /**
     * When conversation was started
     */
    conversationStartedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // RELATED ENTITIES
    // ==========================================

    /**
     * Reference to Match document (if matched)
     */
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },

    /**
     * Reference to Conversation (if started)
     */
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },

    // ==========================================
    // METADATA
    // ==========================================

    /**
     * Source of the interest (how builder found the opening)
     */
    source: {
      type: String,
      enum: ['DISCOVERY', 'SEARCH', 'RECOMMENDATION', 'DIRECT_LINK', 'REFERRAL', 'OTHER'],
      default: 'DISCOVERY',
    },

    /**
     * Whether this is a saved/bookmarked interest
     */
    isSaved: {
      type: Boolean,
      default: false,
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
        // Don't expose founder notes to builders
        if (ret.founderNotes) {
          delete ret.founderNotes;
        }
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

// Unique constraint: one interest per builder per opening
interestSchema.index({ builder: 1, opening: 1 }, { unique: true });

// Compound indexes for queries
interestSchema.index({ founder: 1, status: 1, createdAt: -1 });
interestSchema.index({ builder: 1, status: 1, createdAt: -1 });
interestSchema.index({ opening: 1, status: 1 });
interestSchema.index({ status: 1, createdAt: -1 });
interestSchema.index({ matchedAt: -1 });
interestSchema.index({ interestedAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if interest is still active (not passed/withdrawn/matched)
 */
interestSchema.virtual('isActive').get(function () {
  return [
    INTEREST_STATUS.INTERESTED,
    INTEREST_STATUS.SHORTLISTED,
  ].includes(this.status);
});

/**
 * Check if interest has been viewed by founder
 */
interestSchema.virtual('isViewed').get(function () {
  return !!this.viewedAt;
});

/**
 * Check if interest is shortlisted
 */
interestSchema.virtual('isShortlisted').get(function () {
  return this.status === INTEREST_STATUS.SHORTLISTED;
});

/**
 * Check if matched
 */
interestSchema.virtual('isMatched').get(function () {
  return this.status === INTEREST_STATUS.MATCHED;
});

/**
 * Check if passed
 */
interestSchema.virtual('isPassed').get(function () {
  return this.status === INTEREST_STATUS.PASSED;
});

/**
 * Check if withdrawn
 */
interestSchema.virtual('isWithdrawn').get(function () {
  return this.status === INTEREST_STATUS.WITHDRAWN;
});

/**
 * Days since interest expressed
 */
interestSchema.virtual('daysSinceInterest').get(function () {
  return Math.floor((new Date() - this.interestedAt) / (1000 * 60 * 60 * 24));
});

/**
 * Response time (days from interest to first action)
 */
interestSchema.virtual('responseTimeDays').get(function () {
  const actionDate = this.viewedAt || this.shortlistedAt || this.passedAt;
  if (!actionDate) return null;
  return Math.floor((actionDate - this.interestedAt) / (1000 * 60 * 60 * 24));
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Track status changes in history
 */
interestSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });

    // Update timestamp based on status
    const now = new Date();
    switch (this.status) {
      case INTEREST_STATUS.SHORTLISTED:
        if (!this.shortlistedAt) this.shortlistedAt = now;
        break;
      case INTEREST_STATUS.MATCHED:
        if (!this.matchedAt) this.matchedAt = now;
        break;
      case INTEREST_STATUS.PASSED:
        if (!this.passedAt) this.passedAt = now;
        break;
      case INTEREST_STATUS.WITHDRAWN:
        if (!this.withdrawnAt) this.withdrawnAt = now;
        break;
    }
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark as viewed by founder
 * @returns {Promise<Interest>}
 */
interestSchema.methods.markViewed = async function () {
  if (!this.viewedAt) {
    this.viewedAt = new Date();
    await this.save();
  }
  return this;
};

/**
 * Shortlist the interest
 * @param {string} [notes] - Founder's notes
 * @returns {Promise<Interest>}
 */
interestSchema.methods.shortlist = async function (notes = null) {
  if (this.status !== INTEREST_STATUS.INTERESTED) {
    throw new Error('Can only shortlist from INTERESTED status');
  }
  
  this.status = INTEREST_STATUS.SHORTLISTED;
  if (notes) {
    this.founderNotes = notes;
  }
  
  return this.save();
};

/**
 * Pass on the interest
 * @param {string} reason - Pass reason
 * @param {string} [feedback] - Optional feedback
 * @returns {Promise<Interest>}
 */
interestSchema.methods.pass = async function (reason, feedback = null) {
  if (![INTEREST_STATUS.INTERESTED, INTEREST_STATUS.SHORTLISTED].includes(this.status)) {
    throw new Error('Cannot pass on this interest');
  }
  
  this.status = INTEREST_STATUS.PASSED;
  this.passReason = reason;
  if (feedback) {
    this.passFeedback = feedback;
  }
  
  return this.save();
};

/**
 * Withdraw the interest (by builder)
 * @returns {Promise<Interest>}
 */
interestSchema.methods.withdraw = async function () {
  if (![INTEREST_STATUS.INTERESTED, INTEREST_STATUS.SHORTLISTED].includes(this.status)) {
    throw new Error('Cannot withdraw this interest');
  }
  
  this.status = INTEREST_STATUS.WITHDRAWN;
  return this.save();
};

/**
 * Convert to match
 * @param {ObjectId} matchId - ID of the created Match document
 * @returns {Promise<Interest>}
 */
interestSchema.methods.convertToMatch = async function (matchId) {
  if (this.status !== INTEREST_STATUS.SHORTLISTED) {
    throw new Error('Can only match from SHORTLISTED status');
  }
  
  this.status = INTEREST_STATUS.MATCHED;
  this.match = matchId;
  
  return this.save();
};

/**
 * Link conversation to interest
 * @param {ObjectId} conversationId - Conversation ID
 * @returns {Promise<Interest>}
 */
interestSchema.methods.linkConversation = async function (conversationId) {
  this.conversation = conversationId;
  this.conversationStartedAt = new Date();
  return this.save();
};

/**
 * Set founder rating
 * @param {number} rating - Rating 1-5
 * @returns {Promise<Interest>}
 */
interestSchema.methods.setRating = async function (rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  this.founderRating = rating;
  return this.save();
};

/**
 * Get data for builder view (hide founder notes)
 * @returns {Object}
 */
interestSchema.methods.getBuilderView = function () {
  return {
    id: this._id,
    opening: this.opening,
    status: this.status,
    message: this.message,
    questionAnswers: this.questionAnswers,
    compatibilityScore: this.compatibilityScore,
    interestedAt: this.interestedAt,
    viewedAt: this.viewedAt,
    shortlistedAt: this.shortlistedAt,
    matchedAt: this.matchedAt,
    passedAt: this.passedAt,
    passFeedback: this.passFeedback, // Share feedback but not reason
    isActive: this.isActive,
    isViewed: this.isViewed,
    daysSinceInterest: this.daysSinceInterest,
  };
};

/**
 * Get data for founder view (includes notes)
 * @returns {Object}
 */
interestSchema.methods.getFounderView = function () {
  return {
    id: this._id,
    builder: this.builder,
    builderProfile: this.builderProfile,
    opening: this.opening,
    status: this.status,
    message: this.message,
    questionAnswers: this.questionAnswers,
    expectedCompensation: this.expectedCompensation,
    availability: this.availability,
    founderNotes: this.founderNotes,
    founderRating: this.founderRating,
    passReason: this.passReason,
    passFeedback: this.passFeedback,
    compatibilityScore: this.compatibilityScore,
    compatibilityBreakdown: this.compatibilityBreakdown,
    scenarioCompatibility: this.scenarioCompatibility,
    interestedAt: this.interestedAt,
    viewedAt: this.viewedAt,
    shortlistedAt: this.shortlistedAt,
    matchedAt: this.matchedAt,
    passedAt: this.passedAt,
    source: this.source,
    isActive: this.isActive,
    daysSinceInterest: this.daysSinceInterest,
    responseTimeDays: this.responseTimeDays,
  };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Create interest with validation
 * @param {Object} data - Interest data
 * @returns {Promise<Interest>}
 */
interestSchema.statics.createInterest = async function (data) {
  // Check if interest already exists
  const existing = await this.findOne({
    builder: data.builder,
    opening: data.opening,
  });

  if (existing) {
    if (existing.status === INTEREST_STATUS.WITHDRAWN) {
      // Allow re-expressing interest after withdrawal
      existing.status = INTEREST_STATUS.INTERESTED;
      existing.interestedAt = new Date();
      existing.withdrawnAt = null;
      existing.message = data.message;
      existing.questionAnswers = data.questionAnswers || [];
      return existing.save();
    }
    throw new Error('Interest already exists for this opening');
  }

  return this.create(data);
};

/**
 * Find interests by builder
 * @param {ObjectId} builderId - Builder's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Interest[]>}
 */
interestSchema.statics.findByBuilder = function (builderId, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  
  const query = { builder: builderId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ interestedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('opening', 'title roleType status')
    .populate('founder', 'name profilePhoto');
};

/**
 * Find interests for an opening
 * @param {ObjectId} openingId - Opening ID
 * @param {Object} options - Query options
 * @returns {Promise<Interest[]>}
 */
interestSchema.statics.findByOpening = function (openingId, options = {}) {
  const { status, page = 1, limit = 20, sort = { interestedAt: -1 } } = options;
  
  const query = { opening: openingId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('builder', 'name profilePhoto')
    .populate('builderProfile', 'headline skills riskAppetite hoursPerWeek');
};

/**
 * Find interests for a founder (across all openings)
 * @param {ObjectId} founderId - Founder's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Interest[]>}
 */
interestSchema.statics.findByFounder = function (founderId, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  
  const query = { founder: founderId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ interestedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('builder', 'name profilePhoto')
    .populate('builderProfile', 'headline skills riskAppetite hoursPerWeek')
    .populate('opening', 'title roleType');
};

/**
 * Get new (unviewed) interests for founder
 * @param {ObjectId} founderId - Founder's user ID
 * @returns {Promise<Interest[]>}
 */
interestSchema.statics.findNewForFounder = function (founderId) {
  return this.find({
    founder: founderId,
    status: INTEREST_STATUS.INTERESTED,
    viewedAt: null,
  })
    .sort({ interestedAt: -1 })
    .populate('builder', 'name profilePhoto')
    .populate('builderProfile', 'headline skills riskAppetite')
    .populate('opening', 'title roleType');
};

/**
 * Get shortlisted interests for founder
 * @param {ObjectId} founderId - Founder's user ID
 * @returns {Promise<Interest[]>}
 */
interestSchema.statics.findShortlistedByFounder = function (founderId) {
  return this.find({
    founder: founderId,
    status: INTEREST_STATUS.SHORTLISTED,
  })
    .sort({ shortlistedAt: -1 })
    .populate('builder', 'name profilePhoto')
    .populate('builderProfile', 'headline skills riskAppetite hoursPerWeek')
    .populate('opening', 'title roleType');
};

/**
 * Check if builder has expressed interest in opening
 * @param {ObjectId} builderId - Builder's user ID
 * @param {ObjectId} openingId - Opening ID
 * @returns {Promise<Interest|null>}
 */
interestSchema.statics.findExisting = function (builderId, openingId) {
  return this.findOne({ builder: builderId, opening: openingId });
};

/**
 * Count interests by status for a founder
 * @param {ObjectId} founderId - Founder's user ID
 * @returns {Promise<Object>}
 */
interestSchema.statics.countByStatusForFounder = async function (founderId) {
  const results = await this.aggregate([
    { $match: { founder: new mongoose.Types.ObjectId(founderId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return results.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Count interests by status for a builder
 * @param {ObjectId} builderId - Builder's user ID
 * @returns {Promise<Object>}
 */
interestSchema.statics.countByStatusForBuilder = async function (builderId) {
  const results = await this.aggregate([
    { $match: { builder: new mongoose.Types.ObjectId(builderId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return results.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Get interest statistics for an opening
 * @param {ObjectId} openingId - Opening ID
 * @returns {Promise<Object>}
 */
interestSchema.statics.getOpeningStats = async function (openingId) {
  const results = await this.aggregate([
    { $match: { opening: new mongoose.Types.ObjectId(openingId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompatibility: { $avg: '$compatibilityScore' },
      },
    },
  ]);

  const stats = {
    total: 0,
    byStatus: {},
    avgCompatibility: null,
  };

  let totalCompatibility = 0;
  let compatibilityCount = 0;

  results.forEach(({ _id, count, avgCompatibility }) => {
    stats.byStatus[_id] = count;
    stats.total += count;
    if (avgCompatibility) {
      totalCompatibility += avgCompatibility * count;
      compatibilityCount += count;
    }
  });

  if (compatibilityCount > 0) {
    stats.avgCompatibility = Math.round(totalCompatibility / compatibilityCount);
  }

  return stats;
};

/**
 * Get average response time for a founder
 * @param {ObjectId} founderId - Founder's user ID
 * @returns {Promise<number|null>} Average response time in hours
 */
interestSchema.statics.getAverageResponseTime = async function (founderId) {
  const results = await this.aggregate([
    {
      $match: {
        founder: new mongoose.Types.ObjectId(founderId),
        viewedAt: { $ne: null },
      },
    },
    {
      $project: {
        responseTime: { $subtract: ['$viewedAt', '$interestedAt'] },
      },
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
      },
    },
  ]);

  if (results.length === 0) return null;
  
  // Convert milliseconds to hours
  return Math.round(results[0].avgResponseTime / (1000 * 60 * 60));
};

// ============================================
// MODEL EXPORT
// ============================================

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;
