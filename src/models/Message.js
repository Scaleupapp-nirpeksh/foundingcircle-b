/**
 * @fileoverview Message model - Individual messages in conversations
 * 
 * Represents a single message:
 * - Text, system, or attachment messages
 * - Read receipts
 * - Ice breakers and trial updates
 * 
 * @module models/Message
 */

const mongoose = require('mongoose');
const { MESSAGE_TYPES } = require('../constants');

const { Schema } = mongoose;

// ============================================
// MAIN SCHEMA
// ============================================

const messageSchema = new Schema(
  {
    // ==========================================
    // REFERENCES
    // ==========================================

    /**
     * Conversation this message belongs to
     */
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation reference is required'],
      index: true,
    },

    /**
     * User who sent the message (null for system messages)
     */
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // ==========================================
    // MESSAGE CONTENT
    // ==========================================

    /**
     * Message type
     */
    messageType: {
      type: String,
      enum: {
        values: Object.values(MESSAGE_TYPES),
        message: 'Invalid message type',
      },
      default: MESSAGE_TYPES.TEXT,
      index: true,
    },

    /**
     * Message content/text
     */
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },

    /**
     * Whether this is a system-generated message
     */
    isSystemMessage: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // ATTACHMENTS
    // ==========================================

    /**
     * Attachment URL (for images, files)
     */
    attachmentUrl: {
      type: String,
      default: null,
    },

    /**
     * Attachment type
     */
    attachmentType: {
      type: String,
      enum: ['image', 'file', 'document', null],
      default: null,
    },

    /**
     * Attachment file name
     */
    attachmentName: {
      type: String,
      default: null,
    },

    /**
     * Attachment file size in bytes
     */
    attachmentSize: {
      type: Number,
      default: null,
    },

    // ==========================================
    // READ STATUS
    // ==========================================

    /**
     * When message was read by recipient
     */
    readAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // METADATA
    // ==========================================

    /**
     * Additional metadata (for trial proposals, etc.)
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // ==========================================
    // MODERATION
    // ==========================================

    /**
     * Whether message has been deleted
     */
    isDeleted: {
      type: Boolean,
      default: false,
    },

    /**
     * When message was deleted
     */
    deletedAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether message has been flagged
     */
    isFlagged: {
      type: Boolean,
      default: false,
    },

    /**
     * Flag reason
     */
    flagReason: {
      type: String,
      default: null,
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
        // Don't show deleted message content
        if (ret.isDeleted) {
          ret.content = 'This message has been deleted';
          ret.attachmentUrl = null;
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

// Compound indexes for queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, sender: 1, readAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if message has been read
 */
messageSchema.virtual('isRead').get(function () {
  return !!this.readAt;
});

/**
 * Check if message has attachment
 */
messageSchema.virtual('hasAttachment').get(function () {
  return !!this.attachmentUrl;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark message as read
 * @returns {Promise<Message>}
 */
messageSchema.methods.markAsRead = async function () {
  if (!this.readAt) {
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Soft delete message
 * @returns {Promise<Message>}
 */
messageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Flag message
 * @param {string} reason - Flag reason
 * @returns {Promise<Message>}
 */
messageSchema.methods.flag = async function (reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get messages for a conversation
 * @param {ObjectId} conversationId - Conversation ID
 * @param {Object} options - Query options
 * @returns {Promise<Message[]>}
 */
messageSchema.statics.getForConversation = function (conversationId, options = {}) {
  const { page = 1, limit = 50, before } = options;
  
  const query = { 
    conversation: conversationId,
    isDeleted: false,
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name email avatarUrl');
};

/**
 * Get unread count for a user in a conversation
 * @param {ObjectId} conversationId - Conversation ID
 * @param {ObjectId} userId - User ID (recipient)
 * @returns {Promise<number>}
 */
messageSchema.statics.getUnreadCount = function (conversationId, userId) {
  return this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    readAt: null,
    isSystemMessage: false,
    isDeleted: false,
  });
};

/**
 * Mark all messages as read in a conversation
 * @param {ObjectId} conversationId - Conversation ID
 * @param {ObjectId} userId - Reader's user ID
 * @returns {Promise<Object>} Update result
 */
messageSchema.statics.markAllAsRead = function (conversationId, userId) {
  return this.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    }
  );
};

// ============================================
// MODEL EXPORT
// ============================================

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;