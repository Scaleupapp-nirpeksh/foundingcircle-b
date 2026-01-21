/**
 * @fileoverview Conversation model - Chat conversations between matched users
 * 
 * Represents a chat thread between a founder and builder:
 * - Created after mutual match
 * - Links to interest/match
 * - Tracks message count and last activity
 * 
 * @module models/Conversation
 */

const mongoose = require('mongoose');
const { CONVERSATION_STATUS } = require('../../../shared/constants');

const { Schema } = mongoose;

// ============================================
// MAIN SCHEMA
// ============================================

const conversationSchema = new Schema(
  {
    // ==========================================
    // PARTICIPANTS
    // ==========================================

    /**
     * Array of participant user IDs (founder and builder)
     */
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],

    /**
     * The founder in the conversation
     */
    founder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Founder reference is required'],
      index: true,
    },

    /**
     * The builder in the conversation
     */
    builder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Builder reference is required'],
      index: true,
    },

    // ==========================================
    // REFERENCES
    // ==========================================

    /**
     * Reference to the interest/match that created this conversation
     */
    interest: {
      type: Schema.Types.ObjectId,
      ref: 'Interest',
      required: [true, 'Interest reference is required'],
    },

    /**
     * Reference to the opening
     */
    opening: {
      type: Schema.Types.ObjectId,
      ref: 'Opening',
    },

    /**
     * Reference to active trial (if any)
     */
    trial: {
      type: Schema.Types.ObjectId,
      ref: 'Trial',
      default: null,
    },

    // ==========================================
    // STATUS
    // ==========================================

    /**
     * Conversation status
     */
    status: {
      type: String,
      enum: {
        values: Object.values(CONVERSATION_STATUS),
        message: 'Invalid conversation status',
      },
      default: CONVERSATION_STATUS.ACTIVE,
      index: true,
    },

    // ==========================================
    // MESSAGE TRACKING
    // ==========================================

    /**
     * Reference to the last message
     */
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    /**
     * Timestamp of last message
     */
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },

    /**
     * Total message count
     */
    messageCount: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // ARCHIVE INFO
    // ==========================================

    /**
     * When conversation was archived
     */
    archivedAt: {
      type: Date,
      default: null,
    },

    /**
     * Who archived the conversation
     */
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

// Compound indexes for queries
conversationSchema.index({ participants: 1, status: 1 });
conversationSchema.index({ founder: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ builder: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ interest: 1 }, { unique: true });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if conversation is active
 */
conversationSchema.virtual('isActive').get(function () {
  return this.status === CONVERSATION_STATUS.ACTIVE;
});

/**
 * Check if conversation is archived
 */
conversationSchema.virtual('isArchived').get(function () {
  return this.status === CONVERSATION_STATUS.ARCHIVED;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if user is a participant
 * @param {ObjectId} userId - User ID to check
 * @returns {boolean}
 */
conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

/**
 * Get the other participant
 * @param {ObjectId} userId - Current user's ID
 * @returns {ObjectId} Other participant's ID
 */
conversationSchema.methods.getOtherParticipant = function (userId) {
  return this.participants.find(p => p.toString() !== userId.toString());
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find conversations for a user
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Conversation[]>}
 */
conversationSchema.statics.findByUser = function (userId, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  
  const query = { participants: userId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('founder', 'name email avatarUrl')
    .populate('builder', 'name email avatarUrl')
    .populate('lastMessage');
};

/**
 * Find conversation between two users
 * @param {ObjectId} user1Id - First user ID
 * @param {ObjectId} user2Id - Second user ID
 * @returns {Promise<Conversation|null>}
 */
conversationSchema.statics.findBetweenUsers = function (user1Id, user2Id) {
  return this.findOne({
    participants: { $all: [user1Id, user2Id] },
  });
};

// ============================================
// MODEL EXPORT
// ============================================

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
