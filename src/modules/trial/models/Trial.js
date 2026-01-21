/**
 * @fileoverview Trial model - Trial collaboration between matched users
 * 
 * Represents a trial sprint between founder and builder:
 * - Per PRD: 7/14/21 day trial periods
 * - Check-in reminders
 * - Feedback collection
 * 
 * @module models/Trial
 */

const mongoose = require('mongoose');
const { 
  TRIAL_STATUS, 
  CHECKIN_FREQUENCY,
  TRIAL_OUTCOME,
} = require('../../../shared/constants');

const { Schema } = mongoose;

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Feedback sub-schema
 */
const feedbackSchema = new Schema(
  {
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
    wouldContinue: {
      type: Boolean,
    },
    privateNotes: {
      type: String,
      maxlength: 1000,
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

const trialSchema = new Schema(
  {
    // ==========================================
    // REFERENCES
    // ==========================================

    /**
     * Reference to the conversation
     */
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation reference is required'],
      index: true,
    },

    /**
     * Reference to the interest/match
     */
    interest: {
      type: Schema.Types.ObjectId,
      ref: 'Interest',
    },

    /**
     * The founder in the trial
     */
    founder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Founder reference is required'],
      index: true,
    },

    /**
     * The builder in the trial
     */
    builder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Builder reference is required'],
      index: true,
    },

    /**
     * Reference to the opening
     */
    opening: {
      type: Schema.Types.ObjectId,
      ref: 'Opening',
    },

    // ==========================================
    // TRIAL CONFIGURATION
    // ==========================================

    /**
     * Who proposed the trial
     */
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proposer reference is required'],
    },

    /**
     * Trial duration in days (7, 14, or 21)
     */
    durationDays: {
      type: Number,
      enum: {
        values: [7, 14, 21],
        message: 'Duration must be 7, 14, or 21 days',
      },
      required: [true, 'Duration is required'],
    },

    /**
     * Trial goal/deliverable
     */
    goal: {
      type: String,
      required: [true, 'Trial goal is required'],
      maxlength: [500, 'Goal cannot exceed 500 characters'],
    },

    /**
     * Check-in frequency
     */
    checkinFrequency: {
      type: String,
      enum: {
        values: Object.values(CHECKIN_FREQUENCY),
        message: 'Invalid check-in frequency',
      },
      default: CHECKIN_FREQUENCY.WEEKLY,
    },

    // ==========================================
    // STATUS
    // ==========================================

    /**
     * Trial status
     */
    status: {
      type: String,
      enum: {
        values: Object.values(TRIAL_STATUS),
        message: 'Invalid trial status',
      },
      default: TRIAL_STATUS.PROPOSED,
      index: true,
    },

    // ==========================================
    // TIMESTAMPS
    // ==========================================

    /**
     * When the trial was proposed
     */
    proposedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * When the trial was accepted/started
     */
    acceptedAt: {
      type: Date,
      default: null,
    },

    /**
     * Expected end date
     */
    endsAt: {
      type: Date,
      default: null,
    },

    /**
     * Actual completion date
     */
    completedAt: {
      type: Date,
      default: null,
    },

    /**
     * Cancellation date (if cancelled)
     */
    cancelledAt: {
      type: Date,
      default: null,
    },

    /**
     * Who cancelled (if cancelled)
     */
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ==========================================
    // FEEDBACK
    // ==========================================

    /**
     * Founder's feedback
     */
    founderFeedback: {
      type: feedbackSchema,
      default: null,
    },

    /**
     * Builder's feedback
     */
    builderFeedback: {
      type: feedbackSchema,
      default: null,
    },

    // ==========================================
    // OUTCOME
    // ==========================================

    /**
     * Trial outcome
     */
    outcome: {
      type: String,
      enum: {
        values: Object.values(TRIAL_OUTCOME),
        message: 'Invalid trial outcome',
      },
      default: TRIAL_OUTCOME.PENDING,
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

trialSchema.index({ founder: 1, status: 1 });
trialSchema.index({ builder: 1, status: 1 });
trialSchema.index({ conversation: 1 }, { unique: true });
trialSchema.index({ status: 1, endsAt: 1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if trial is active
 */
trialSchema.virtual('isActive').get(function () {
  return this.status === TRIAL_STATUS.ACTIVE;
});

/**
 * Days remaining in trial
 */
trialSchema.virtual('daysRemaining').get(function () {
  if (!this.endsAt || this.status !== TRIAL_STATUS.ACTIVE) {
    return null;
  }
  const remaining = Math.ceil((this.endsAt - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
});

/**
 * Check if both parties have submitted feedback
 */
trialSchema.virtual('hasBothFeedback').get(function () {
  return !!(this.founderFeedback?.submittedAt && this.builderFeedback?.submittedAt);
});

/**
 * Check if both parties want to continue
 */
trialSchema.virtual('bothWantToContinue').get(function () {
  if (!this.hasBothFeedback) return null;
  return this.founderFeedback.wouldContinue && this.builderFeedback.wouldContinue;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Accept the trial proposal
 * @returns {Promise<Trial>}
 */
trialSchema.methods.accept = async function () {
  if (this.status !== TRIAL_STATUS.PROPOSED) {
    throw new Error('Can only accept proposed trials');
  }
  
  this.status = TRIAL_STATUS.ACTIVE;
  this.acceptedAt = new Date();
  this.endsAt = new Date(Date.now() + this.durationDays * 24 * 60 * 60 * 1000);
  
  return this.save();
};

/**
 * Cancel the trial
 * @param {ObjectId} userId - User who is cancelling
 * @returns {Promise<Trial>}
 */
trialSchema.methods.cancel = async function (userId) {
  if (![TRIAL_STATUS.PROPOSED, TRIAL_STATUS.ACTIVE].includes(this.status)) {
    throw new Error('Can only cancel proposed or active trials');
  }
  
  this.status = TRIAL_STATUS.CANCELLED;
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  
  return this.save();
};

/**
 * Complete the trial
 * @returns {Promise<Trial>}
 */
trialSchema.methods.complete = async function () {
  if (this.status !== TRIAL_STATUS.ACTIVE) {
    throw new Error('Can only complete active trials');
  }
  
  this.status = TRIAL_STATUS.COMPLETED;
  this.completedAt = new Date();
  
  // Determine outcome based on feedback
  if (this.hasBothFeedback) {
    this.outcome = this.bothWantToContinue ? TRIAL_OUTCOME.CONTINUE : TRIAL_OUTCOME.END;
  }
  
  return this.save();
};

/**
 * Submit founder feedback
 * @param {Object} feedback - Feedback data
 * @returns {Promise<Trial>}
 */
trialSchema.methods.submitFounderFeedback = async function (feedback) {
  this.founderFeedback = {
    ...feedback,
    submittedAt: new Date(),
  };
  return this.save();
};

/**
 * Submit builder feedback
 * @param {Object} feedback - Feedback data
 * @returns {Promise<Trial>}
 */
trialSchema.methods.submitBuilderFeedback = async function (feedback) {
  this.builderFeedback = {
    ...feedback,
    submittedAt: new Date(),
  };
  return this.save();
};

/**
 * Check if user is a participant
 * @param {ObjectId} userId - User ID to check
 * @returns {boolean}
 */
trialSchema.methods.isParticipant = function (userId) {
    // Handle both populated (object) and non-populated (ObjectId) cases
    const founderId = this.founder._id || this.founder;
    const builderId = this.builder._id || this.builder;
    
    return (
      founderId.toString() === userId.toString() ||
      builderId.toString() === userId.toString()
    );
  };

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find active trials for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Trial[]>}
 */
trialSchema.statics.findActiveByUser = function (userId) {
  return this.find({
    $or: [{ founder: userId }, { builder: userId }],
    status: TRIAL_STATUS.ACTIVE,
  })
    .populate('founder', 'name email')
    .populate('builder', 'name email')
    .sort({ endsAt: 1 });
};

/**
 * Find trials ending soon (for reminders)
 * @param {number} daysAhead - Days to look ahead
 * @returns {Promise<Trial[]>}
 */
trialSchema.statics.findEndingSoon = function (daysAhead = 2) {
  const cutoff = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  
  return this.find({
    status: TRIAL_STATUS.ACTIVE,
    endsAt: { $lte: cutoff, $gte: new Date() },
  })
    .populate('founder', 'name email')
    .populate('builder', 'name email');
};

/**
 * Find trials needing feedback (completed but missing feedback)
 * @returns {Promise<Trial[]>}
 */
trialSchema.statics.findNeedingFeedback = function () {
  return this.find({
    status: TRIAL_STATUS.COMPLETED,
    $or: [
      { founderFeedback: null },
      { builderFeedback: null },
    ],
  })
    .populate('founder', 'name email')
    .populate('builder', 'name email');
};

// ============================================
// MODEL EXPORT
// ============================================

const Trial = mongoose.model('Trial', trialSchema);

module.exports = Trial;
