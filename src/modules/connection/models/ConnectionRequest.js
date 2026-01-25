/**
 * @fileoverview Connection Request Model
 *
 * Handles direct outreach between users:
 * - Builder → Founder (expressing interest in startup/collaboration)
 * - Founder → Founder (seeking co-founders/collaboration)
 * - Builder → Builder (potential co-builder/collaboration)
 *
 * This is separate from the Opening/Interest flow - it's for general networking
 * and cold outreach without a specific job opening.
 *
 * @module models/ConnectionRequest
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ============================================
// CONNECTION REQUEST STATUS
// ============================================

const CONNECTION_STATUS = Object.freeze({
  PENDING: 'PENDING',       // Request sent, awaiting response
  ACCEPTED: 'ACCEPTED',     // Recipient accepted, conversation enabled
  DECLINED: 'DECLINED',     // Recipient declined
  EXPIRED: 'EXPIRED',       // Request expired (no response)
  WITHDRAWN: 'WITHDRAWN',   // Sender withdrew the request
});

// ============================================
// CONNECTION TYPE
// ============================================

const CONNECTION_TYPE = Object.freeze({
  BUILDER_TO_FOUNDER: 'BUILDER_TO_FOUNDER',   // Builder reaching out to founder
  FOUNDER_TO_FOUNDER: 'FOUNDER_TO_FOUNDER',   // Founder seeking co-founder
  BUILDER_TO_BUILDER: 'BUILDER_TO_BUILDER',   // Builders collaborating
  FOUNDER_TO_BUILDER: 'FOUNDER_TO_BUILDER',   // Founder reaching out to builder
});

// ============================================
// SCHEMA DEFINITION
// ============================================

const connectionRequestSchema = new Schema(
  {
    // ==========================================
    // PARTICIPANTS
    // ==========================================

    /**
     * User who sent the request
     */
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /**
     * User who received the request
     */
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /**
     * Type of connection
     */
    connectionType: {
      type: String,
      enum: Object.values(CONNECTION_TYPE),
      required: true,
    },

    // ==========================================
    // NOTE/MESSAGE
    // ==========================================

    /**
     * Note/message from sender explaining why they want to connect
     */
    note: {
      type: String,
      required: [true, 'A note is required when sending a connection request'],
      minlength: [20, 'Note must be at least 20 characters'],
      maxlength: [1000, 'Note cannot exceed 1000 characters'],
      trim: true,
    },

    /**
     * Subject/title for the connection request
     */
    subject: {
      type: String,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
      trim: true,
    },

    /**
     * Intent of the connection (what kind of collaboration)
     */
    intent: {
      type: String,
      enum: [
        'COFOUNDER',           // Looking for co-founder
        'EMPLOYMENT',          // Interested in potential employment
        'COLLABORATION',       // General collaboration
        'MENTORSHIP',          // Seeking mentorship
        'INVESTMENT',          // Investment discussion
        'PARTNERSHIP',         // Business partnership
        'OTHER',               // Other
      ],
      default: 'COLLABORATION',
    },

    // ==========================================
    // STATUS & TIMESTAMPS
    // ==========================================

    /**
     * Current status of the request
     */
    status: {
      type: String,
      enum: Object.values(CONNECTION_STATUS),
      default: CONNECTION_STATUS.PENDING,
      index: true,
    },

    /**
     * When the request was viewed by recipient
     */
    viewedAt: {
      type: Date,
      default: null,
    },

    /**
     * When the recipient responded (accepted/declined)
     */
    respondedAt: {
      type: Date,
      default: null,
    },

    /**
     * Recipient's response message (optional)
     */
    responseMessage: {
      type: String,
      maxlength: [500, 'Response message cannot exceed 500 characters'],
      trim: true,
    },

    /**
     * Request expiry date (auto-expire after X days)
     */
    expiresAt: {
      type: Date,
      default: function() {
        // Expire after 30 days
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      },
    },

    // ==========================================
    // RELATED ENTITIES
    // ==========================================

    /**
     * Conversation created after acceptance
     */
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },

    /**
     * Optional: Related opening (if sender found recipient through an opening)
     */
    relatedOpening: {
      type: Schema.Types.ObjectId,
      ref: 'Opening',
      default: null,
    },

    // ==========================================
    // METADATA
    // ==========================================

    /**
     * How the sender found the recipient
     */
    discoverySource: {
      type: String,
      enum: ['SEARCH', 'RECOMMENDED', 'OPENING', 'PROFILE_VIEW', 'OTHER'],
      default: 'SEARCH',
    },

    /**
     * Compatibility score (if calculated)
     */
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES
// ============================================

// Compound index for querying user's requests
connectionRequestSchema.index({ sender: 1, status: 1 });
connectionRequestSchema.index({ recipient: 1, status: 1 });

// Unique constraint: One pending request per sender-recipient pair
connectionRequestSchema.index(
  { sender: 1, recipient: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: CONNECTION_STATUS.PENDING }
  }
);

// Expiry index
connectionRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// VIRTUALS
// ============================================

/**
 * Check if request is pending
 */
connectionRequestSchema.virtual('isPending').get(function() {
  return this.status === CONNECTION_STATUS.PENDING;
});

/**
 * Check if request is accepted
 */
connectionRequestSchema.virtual('isAccepted').get(function() {
  return this.status === CONNECTION_STATUS.ACCEPTED;
});

/**
 * Check if request has expired
 */
connectionRequestSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Accept the connection request
 */
connectionRequestSchema.methods.accept = async function(responseMessage = null) {
  if (this.status !== CONNECTION_STATUS.PENDING) {
    throw new Error('Can only accept pending requests');
  }

  this.status = CONNECTION_STATUS.ACCEPTED;
  this.respondedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }

  return this.save();
};

/**
 * Decline the connection request
 */
connectionRequestSchema.methods.decline = async function(responseMessage = null) {
  if (this.status !== CONNECTION_STATUS.PENDING) {
    throw new Error('Can only decline pending requests');
  }

  this.status = CONNECTION_STATUS.DECLINED;
  this.respondedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }

  return this.save();
};

/**
 * Withdraw the connection request (sender action)
 */
connectionRequestSchema.methods.withdraw = async function() {
  if (this.status !== CONNECTION_STATUS.PENDING) {
    throw new Error('Can only withdraw pending requests');
  }

  this.status = CONNECTION_STATUS.WITHDRAWN;
  return this.save();
};

/**
 * Mark as viewed
 */
connectionRequestSchema.methods.markViewed = async function() {
  if (!this.viewedAt) {
    this.viewedAt = new Date();
    return this.save();
  }
  return this;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get pending requests for a user
 */
connectionRequestSchema.statics.getPendingForUser = function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    recipient: userId,
    status: CONNECTION_STATUS.PENDING,
  })
    .populate('sender', 'name profilePhoto userType')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Check if a connection request exists between two users
 */
connectionRequestSchema.statics.existsBetween = async function(userId1, userId2) {
  const request = await this.findOne({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 },
    ],
    status: { $in: [CONNECTION_STATUS.PENDING, CONNECTION_STATUS.ACCEPTED] },
  });

  return !!request;
};

/**
 * Get connection between two users
 */
connectionRequestSchema.statics.getConnection = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 },
    ],
    status: CONNECTION_STATUS.ACCEPTED,
  });
};

// ============================================
// MODEL EXPORT
// ============================================

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

module.exports = {
  ConnectionRequest,
  CONNECTION_STATUS,
  CONNECTION_TYPE,
};
