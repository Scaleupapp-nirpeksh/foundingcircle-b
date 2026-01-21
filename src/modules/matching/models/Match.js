/**
 * @fileoverview Match model - Mutual matches between founders and builders
 * 
 * Represents when both parties have expressed interest:
 * - Match status lifecycle
 * - Compatibility scores
 * - Conversation and trial tracking
 * - Outcome recording
 * 
 * @module models/Match
 */

const mongoose = require('mongoose');
const { MATCH_STATUS } = require('../../../shared/constants');

const { Schema } = mongoose;

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Compatibility breakdown sub-schema
 */
const compatibilityBreakdownSchema = new Schema(
  {
    skills: {
      type: Number,
      min: 0,
      max: 100,
    },
    compensation: {
      type: Number,
      min: 0,
      max: 100,
    },
    commitment: {
      type: Number,
      min: 0,
      max: 100,
    },
    riskAppetite: {
      type: Number,
      min: 0,
      max: 100,
    },
    scenario: {
      type: Number,
      min: 0,
      max: 100,
    },
    location: {
      type: Number,
      min: 0,
      max: 100,
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
    reason: {
      type: String,
      maxlength: 200,
    },
  },
  { _id: false }
);

/**
 * Feedback sub-schema (for match outcome)
 */
const feedbackSchema = new Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5,
    },
    skillMatch: {
      type: Number,
      min: 1,
      max: 5,
    },
    wouldRecommend: {
      type: Boolean,
    },
    publicFeedback: {
      type: String,
      maxlength: 500,
    },
    privateFeedback: {
      type: String,
      maxlength: 500,
    },
    submittedAt: {
      type: Date,
    },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMA
// ============================================

const matchSchema = new Schema(
  {
    // ==========================================
    // REFERENCES
    // ==========================================

    /**
     * The founder in the match
     */
    founder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Founder reference is required'],
      index: true,
    },

    /**
     * Founder's profile
     */
    founderProfile: {
      type: Schema.Types.ObjectId,
      ref: 'FounderProfile',
      required: [true, 'Founder profile reference is required'],
    },

    /**
     * The builder in the match
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
     * The opening this match is for
     */
    opening: {
      type: Schema.Types.ObjectId,
      ref: 'Opening',
      required: [true, 'Opening reference is required'],
      index: true,
    },

    /**
     * Reference to the original interest
     */
    interest: {
      type: Schema.Types.ObjectId,
      ref: 'Interest',
      
    },

    // ==========================================
    // STATUS
    // ==========================================

    /**
     * Current status of the match
     */
    status: {
      type: String,
      enum: {
        values: Object.values(MATCH_STATUS),
        message: 'Invalid match status',
      },
      default: MATCH_STATUS.ACTIVE,
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
    // COMPATIBILITY
    // ==========================================

    /**
     * Overall compatibility score
     */
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, 'Compatibility score is required'],
    },

    /**
     * Detailed compatibility breakdown
     */
    compatibilityBreakdown: {
      type: compatibilityBreakdownSchema,
      default: {},
    },

    /**
     * Scenario-based compatibility score
     */
    scenarioCompatibility: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // ==========================================
    // CONVERSATION
    // ==========================================

    /**
     * Reference to the conversation
     */
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },

    /**
     * Whether conversation has started
     */
    conversationStarted: {
      type: Boolean,
      default: false,
    },

    /**
     * Message count in conversation
     */
    messageCount: {
      type: Number,
      default: 0,
    },

    /**
     * Last message timestamp
     */
    lastMessageAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // TRIAL
    // ==========================================

    /**
     * Reference to active/completed trial
     */
    trial: {
      type: Schema.Types.ObjectId,
      ref: 'Trial',
      default: null,
    },

    /**
     * Whether a trial has been conducted
     */
    hadTrial: {
      type: Boolean,
      default: false,
    },

    /**
     * Trial outcome (if trial was conducted)
     */
    trialOutcome: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'UNSUCCESSFUL', 'CANCELLED'],
      default: null,
    },

    // ==========================================
    // OUTCOME
    // ==========================================

    /**
     * Final outcome of the match
     */
    outcome: {
      type: String,
      enum: [
        'PENDING',           // Still active
        'HIRED',             // Builder was hired
        'TRIAL_SUCCESS',     // Trial successful, continuing
        'TRIAL_FAILED',      // Trial unsuccessful
        'DECLINED_FOUNDER',  // Founder declined after match
        'DECLINED_BUILDER',  // Builder declined after match
        'INACTIVE',          // No activity, naturally ended
        'POSITION_FILLED',   // Position filled by someone else
        'OTHER',
      ],
      default: 'PENDING',
    },

    /**
     * Outcome details/reason
     */
    outcomeReason: {
      type: String,
      maxlength: 500,
    },

    /**
     * Outcome recorded date
     */
    outcomeRecordedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // FEEDBACK
    // ==========================================

    /**
     * Founder's feedback on the match
     */
    founderFeedback: {
      type: feedbackSchema,
      default: null,
    },

    /**
     * Builder's feedback on the match
     */
    builderFeedback: {
      type: feedbackSchema,
      default: null,
    },

    // ==========================================
    // TIMESTAMPS
    // ==========================================

    /**
     * When the match was created
     */
    matchedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * When first message was sent
     */
    firstMessageAt: {
      type: Date,
      default: null,
    },

    /**
     * When trial was started
     */
    trialStartedAt: {
      type: Date,
      default: null,
    },

    /**
     * When match was completed/closed
     */
    completedAt: {
      type: Date,
      default: null,
    },

    /**
     * Last activity on this match
     */
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // FLAGS
    // ==========================================

    /**
     * Whether match is featured (for success stories)
     */
    isFeatured: {
      type: Boolean,
      default: false,
    },

    /**
     * Whether match resulted in successful hire
     */
    isSuccessfulHire: {
      type: Boolean,
      default: false,
    },

    /**
     * Whether users consented to share as success story
     */
    canShareStory: {
      type: Boolean,
      default: false,
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

// Unique constraint: one match per builder per opening
matchSchema.index({ builder: 1, opening: 1 }, { unique: true });

// Compound indexes for queries
matchSchema.index({ founder: 1, status: 1, matchedAt: -1 });
matchSchema.index({ builder: 1, status: 1, matchedAt: -1 });
matchSchema.index({ opening: 1, status: 1 });
matchSchema.index({ status: 1, matchedAt: -1 });
matchSchema.index({ outcome: 1 });
matchSchema.index({ lastActivityAt: -1 });
matchSchema.index({ isSuccessfulHire: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if match is active
 */
matchSchema.virtual('isActive').get(function () {
  return [
    MATCH_STATUS.ACTIVE,
    MATCH_STATUS.IN_TRIAL,
  ].includes(this.status);
});

/**
 * Check if match is in trial
 */
matchSchema.virtual('isInTrial').get(function () {
  return this.status === MATCH_STATUS.IN_TRIAL;
});

/**
 * Check if match is completed
 */
matchSchema.virtual('isCompleted').get(function () {
  return [
    MATCH_STATUS.COMPLETED,
    MATCH_STATUS.HIRED,
  ].includes(this.status);
});

/**
 * Check if match ended (not successful)
 */
matchSchema.virtual('isEnded').get(function () {
  return this.status === MATCH_STATUS.ENDED;
});

/**
 * Days since match
 */
matchSchema.virtual('daysSinceMatch').get(function () {
  return Math.floor((new Date() - this.matchedAt) / (1000 * 60 * 60 * 24));
});

/**
 * Days since last activity
 */
matchSchema.virtual('daysSinceActivity').get(function () {
  return Math.floor((new Date() - this.lastActivityAt) / (1000 * 60 * 60 * 24));
});

/**
 * Check if both parties have submitted feedback
 */
matchSchema.virtual('hasBothFeedback').get(function () {
  return !!(this.founderFeedback?.submittedAt && this.builderFeedback?.submittedAt);
});

/**
 * Average rating from both parties
 */
matchSchema.virtual('averageRating').get(function () {
  const ratings = [];
  if (this.founderFeedback?.rating) ratings.push(this.founderFeedback.rating);
  if (this.builderFeedback?.rating) ratings.push(this.builderFeedback.rating);
  
  if (ratings.length === 0) return null;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
});

/**
 * Get participants (both users)
 */
matchSchema.virtual('participants').get(function () {
  return [this.founder, this.builder];
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Track status changes in history
 */
matchSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });

    // Update completion timestamp
    if ([MATCH_STATUS.COMPLETED, MATCH_STATUS.HIRED, MATCH_STATUS.ENDED].includes(this.status)) {
      if (!this.completedAt) {
        this.completedAt = new Date();
      }
    }

    // Update successful hire flag
    if (this.status === MATCH_STATUS.HIRED) {
      this.isSuccessfulHire = true;
    }
  }

  // Update lastActivityAt
  this.lastActivityAt = new Date();

  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Link conversation to match
 * @param {ObjectId} conversationId - Conversation ID
 * @returns {Promise<Match>}
 */
matchSchema.methods.linkConversation = async function (conversationId) {
  this.conversation = conversationId;
  this.conversationStarted = true;
  if (!this.firstMessageAt) {
    this.firstMessageAt = new Date();
  }
  return this.save();
};

/**
 * Update message count
 * @param {number} count - New message count
 * @returns {Promise<Match>}
 */
matchSchema.methods.updateMessageCount = async function (count) {
  this.messageCount = count;
  this.lastMessageAt = new Date();
  this.lastActivityAt = new Date();
  return this.save();
};

/**
 * Start a trial
 * @param {ObjectId} trialId - Trial ID
 * @returns {Promise<Match>}
 */
matchSchema.methods.startTrial = async function (trialId) {
  this.trial = trialId;
  this.hadTrial = true;
  this.trialOutcome = 'PENDING';
  this.trialStartedAt = new Date();
  this.status = MATCH_STATUS.IN_TRIAL;
  return this.save();
};

/**
 * Complete trial with outcome
 * @param {string} outcome - Trial outcome ('SUCCESS' | 'UNSUCCESSFUL' | 'CANCELLED')
 * @returns {Promise<Match>}
 */
matchSchema.methods.completeTrial = async function (outcome) {
  if (!['SUCCESS', 'UNSUCCESSFUL', 'CANCELLED'].includes(outcome)) {
    throw new Error('Invalid trial outcome');
  }
  
  this.trialOutcome = outcome;
  
  if (outcome === 'SUCCESS') {
    this.status = MATCH_STATUS.COMPLETED;
    this.outcome = 'TRIAL_SUCCESS';
  } else if (outcome === 'UNSUCCESSFUL') {
    this.status = MATCH_STATUS.ENDED;
    this.outcome = 'TRIAL_FAILED';
  } else {
    this.status = MATCH_STATUS.ACTIVE;
    this.outcome = 'PENDING';
  }
  
  return this.save();
};

/**
 * Mark as hired
 * @param {string} [reason] - Optional reason/notes
 * @returns {Promise<Match>}
 */
matchSchema.methods.markHired = async function (reason = null) {
  this.status = MATCH_STATUS.HIRED;
  this.outcome = 'HIRED';
  this.isSuccessfulHire = true;
  if (reason) {
    this.outcomeReason = reason;
  }
  this.outcomeRecordedAt = new Date();
  return this.save();
};

/**
 * End match
 * @param {string} outcome - Outcome reason
 * @param {string} [reason] - Detailed reason
 * @returns {Promise<Match>}
 */
matchSchema.methods.endMatch = async function (outcome, reason = null) {
  const validOutcomes = [
    'DECLINED_FOUNDER',
    'DECLINED_BUILDER',
    'INACTIVE',
    'POSITION_FILLED',
    'OTHER',
  ];
  
  if (!validOutcomes.includes(outcome)) {
    throw new Error('Invalid end outcome');
  }
  
  this.status = MATCH_STATUS.ENDED;
  this.outcome = outcome;
  if (reason) {
    this.outcomeReason = reason;
  }
  this.outcomeRecordedAt = new Date();
  return this.save();
};

/**
 * Submit founder feedback
 * @param {Object} feedback - Feedback data
 * @returns {Promise<Match>}
 */
matchSchema.methods.submitFounderFeedback = async function (feedback) {
  this.founderFeedback = {
    ...feedback,
    submittedAt: new Date(),
  };
  return this.save();
};

/**
 * Submit builder feedback
 * @param {Object} feedback - Feedback data
 * @returns {Promise<Match>}
 */
matchSchema.methods.submitBuilderFeedback = async function (feedback) {
  this.builderFeedback = {
    ...feedback,
    submittedAt: new Date(),
  };
  return this.save();
};

/**
 * Update activity timestamp
 * @returns {Promise<Match>}
 */
matchSchema.methods.updateActivity = async function () {
  this.lastActivityAt = new Date();
  return this.save();
};

/**
 * Get data for founder view
 * @returns {Object}
 */
matchSchema.methods.getFounderView = function () {
  return {
    id: this._id,
    builder: this.builder,
    builderProfile: this.builderProfile,
    opening: this.opening,
    status: this.status,
    compatibilityScore: this.compatibilityScore,
    compatibilityBreakdown: this.compatibilityBreakdown,
    scenarioCompatibility: this.scenarioCompatibility,
    conversationStarted: this.conversationStarted,
    messageCount: this.messageCount,
    lastMessageAt: this.lastMessageAt,
    hadTrial: this.hadTrial,
    trialOutcome: this.trialOutcome,
    outcome: this.outcome,
    founderFeedback: this.founderFeedback,
    matchedAt: this.matchedAt,
    daysSinceMatch: this.daysSinceMatch,
    isActive: this.isActive,
  };
};

/**
 * Get data for builder view
 * @returns {Object}
 */
matchSchema.methods.getBuilderView = function () {
  return {
    id: this._id,
    founder: this.founder,
    founderProfile: this.founderProfile,
    opening: this.opening,
    status: this.status,
    compatibilityScore: this.compatibilityScore,
    compatibilityBreakdown: this.compatibilityBreakdown,
    scenarioCompatibility: this.scenarioCompatibility,
    conversationStarted: this.conversationStarted,
    messageCount: this.messageCount,
    lastMessageAt: this.lastMessageAt,
    hadTrial: this.hadTrial,
    trialOutcome: this.trialOutcome,
    outcome: this.outcome,
    builderFeedback: this.builderFeedback,
    matchedAt: this.matchedAt,
    daysSinceMatch: this.daysSinceMatch,
    isActive: this.isActive,
  };
};

/**
 * Check if user is participant in match
 * @param {ObjectId} userId - User ID to check
 * @returns {boolean}
 */
matchSchema.methods.isParticipant = function (userId) {
  return (
    this.founder.toString() === userId.toString() ||
    this.builder.toString() === userId.toString()
  );
};

/**
 * Get the other participant
 * @param {ObjectId} userId - Current user's ID
 * @returns {ObjectId} Other participant's ID
 */
matchSchema.methods.getOtherParticipant = function (userId) {
  if (this.founder.toString() === userId.toString()) {
    return this.builder;
  }
  return this.founder;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Create match from interest
 * @param {Object} interest - Interest document
 * @param {Object} compatibilityData - Compatibility scores
 * @returns {Promise<Match>}
 */
matchSchema.statics.createFromInterest = async function (interest, compatibilityData = {}) {
  // Check if match already exists
  const existing = await this.findOne({
    builder: interest.builder,
    opening: interest.opening,
  });

  if (existing) {
    throw new Error('Match already exists for this builder and opening');
  }

  const match = await this.create({
    founder: interest.founder,
    founderProfile: interest.founderProfile || interest.founder,
    builder: interest.builder,
    builderProfile: interest.builderProfile,
    opening: interest.opening,
    interest: interest._id,
    compatibilityScore: compatibilityData.score || interest.compatibilityScore || 0,
    compatibilityBreakdown: compatibilityData.breakdown || interest.compatibilityBreakdown || {},
    scenarioCompatibility: compatibilityData.scenarioScore || interest.scenarioCompatibility,
  });

  return match;
};

/**
 * Find match by ID with full population
 * @param {ObjectId} matchId - Match ID
 * @returns {Promise<Match|null>}
 */
matchSchema.statics.findByIdWithDetails = function (matchId) {
  return this.findById(matchId)
    .populate('founder', 'name email profilePhoto')
    .populate('builder', 'name email profilePhoto')
    .populate('founderProfile', 'startupName tagline startupStage')
    .populate('builderProfile', 'displayName headline skills')
    .populate('opening', 'title roleType');
};

/**
 * Find matches for a founder
 * @param {ObjectId} founderId - Founder's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Match[]>}
 */
matchSchema.statics.findByFounder = function (founderId, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  
  const query = { founder: founderId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ lastActivityAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('builder', 'name profilePhoto')
    .populate('builderProfile', 'displayName headline skills')
    .populate('opening', 'title roleType');
};

/**
 * Find matches for a builder
 * @param {ObjectId} builderId - Builder's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Match[]>}
 */
matchSchema.statics.findByBuilder = function (builderId, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  
  const query = { builder: builderId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ lastActivityAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('founder', 'name profilePhoto')
    .populate('founderProfile', 'startupName tagline startupStage')
    .populate('opening', 'title roleType');
};

/**
 * Find active matches for a user (either role)
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Match[]>}
 */
matchSchema.statics.findActiveByUser = function (userId) {
  return this.find({
    $or: [{ founder: userId }, { builder: userId }],
    status: { $in: [MATCH_STATUS.ACTIVE, MATCH_STATUS.IN_TRIAL] },
  })
    .sort({ lastActivityAt: -1 })
    .populate('founder', 'name profilePhoto')
    .populate('builder', 'name profilePhoto')
    .populate('opening', 'title roleType');
};

/**
 * Find match between specific founder and builder for an opening
 * @param {ObjectId} founderId - Founder ID
 * @param {ObjectId} builderId - Builder ID
 * @param {ObjectId} openingId - Opening ID
 * @returns {Promise<Match|null>}
 */
matchSchema.statics.findExisting = function (founderId, builderId, openingId) {
  return this.findOne({
    founder: founderId,
    builder: builderId,
    opening: openingId,
  });
};

/**
 * Count matches by status for a user
 * @param {ObjectId} userId - User ID
 * @param {string} role - 'founder' or 'builder'
 * @returns {Promise<Object>}
 */
matchSchema.statics.countByStatus = async function (userId, role = 'founder') {
  const matchField = role === 'founder' ? 'founder' : 'builder';
  
  const results = await this.aggregate([
    { $match: { [matchField]: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return results.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Get match statistics for an opening
 * @param {ObjectId} openingId - Opening ID
 * @returns {Promise<Object>}
 */
matchSchema.statics.getOpeningStats = async function (openingId) {
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

  return {
    total: results.reduce((sum, r) => sum + r.count, 0),
    byStatus: results.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
    avgCompatibility: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.avgCompatibility || 0), 0) / results.length)
      : null,
  };
};

/**
 * Get successful matches (for success stories)
 * @param {number} limit - Max results
 * @returns {Promise<Match[]>}
 */
matchSchema.statics.getSuccessStories = function (limit = 10) {
  return this.find({
    isSuccessfulHire: true,
    canShareStory: true,
    isFeatured: true,
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .populate('founder', 'name profilePhoto')
    .populate('builder', 'name profilePhoto')
    .populate('founderProfile', 'startupName')
    .populate('opening', 'title roleType');
};

/**
 * Get matches needing follow-up (inactive for X days)
 * @param {number} inactiveDays - Days of inactivity threshold
 * @returns {Promise<Match[]>}
 */
matchSchema.statics.getInactiveMatches = function (inactiveDays = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

  return this.find({
    status: { $in: [MATCH_STATUS.ACTIVE, MATCH_STATUS.IN_TRIAL] },
    lastActivityAt: { $lt: cutoffDate },
  })
    .populate('founder', 'name email')
    .populate('builder', 'name email');
};

/**
 * Get platform-wide match statistics
 * @returns {Promise<Object>}
 */
matchSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],
        byOutcome: [
          { $match: { outcome: { $ne: 'PENDING' } } },
          { $group: { _id: '$outcome', count: { $sum: 1 } } },
        ],
        overall: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              avgCompatibility: { $avg: '$compatibilityScore' },
              successfulHires: {
                $sum: { $cond: ['$isSuccessfulHire', 1, 0] },
              },
              withTrial: {
                $sum: { $cond: ['$hadTrial', 1, 0] },
              },
            },
          },
        ],
      },
    },
  ]);

  return {
    byStatus: stats[0].byStatus.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
    byOutcome: stats[0].byOutcome.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
    overall: stats[0].overall[0] || {
      total: 0,
      avgCompatibility: null,
      successfulHires: 0,
      withTrial: 0,
    },
  };
};

// ============================================
// MODEL EXPORT
// ============================================

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
