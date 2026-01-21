/**
 * @fileoverview Conversation Service
 * 
 * Handles chat/messaging between matched users:
 * - Creating conversations after mutual match
 * - Sending and receiving messages
 * - Message read status
 * - Ice breaker prompts
 * 
 * Per PRD: Chat unlocked only after mutual match (Interest shortlisted)
 * 
 * @module services/conversation
 */

const { Conversation, Message, Interest, User } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const {
    CONVERSATION_STATUS,
    MESSAGE_TYPES,
    ICE_BREAKER_PROMPTS,
    INTEREST_STATUS,
} = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');
const socketService = require('../../../socket/socketService');
const notificationService = require('../../notification/services/notification.service');

// ============================================
// CONVERSATION CRUD
// ============================================

/**
 * Create a conversation from a mutual match
 * 
 * @param {string} interestId - Interest ID (must be a mutual match / shortlisted)
 * @returns {Promise<Object>} Created conversation
 * @throws {ApiError} If not a mutual match
 */
const createConversationFromMatch = async (interestId) => {
    const interest = await Interest.findById(interestId);
    
    if (!interest) {
      throw ApiError.notFound('Match not found');
    }
    
    // Check if interest is shortlisted (which means mutual match per PRD)
    const isMutualMatch = interest.isMutualMatch || interest.status === INTEREST_STATUS.SHORTLISTED;
    
    if (!isMutualMatch) {
      throw ApiError.forbidden('Conversation can only be created for mutual matches');
    }
    
    // Check if conversation already exists
    if (interest.conversation) {
      const existingConversation = await Conversation.findById(interest.conversation);
      if (existingConversation) {
        return existingConversation;
      }
    }
    
    // Create conversation
    const conversation = await Conversation.create({
      participants: [interest.founder, interest.builder],
      founder: interest.founder,
      builder: interest.builder,
      interest: interestId,
      opening: interest.opening,
      status: CONVERSATION_STATUS.ACTIVE,
    });
    
    // Link conversation to interest
    interest.conversation = conversation._id;
    await interest.save();
    
    // Create ice breaker system message
    const iceBreaker = getRandomIceBreaker();
    await Message.create({
      conversation: conversation._id,
      messageType: MESSAGE_TYPES.ICE_BREAKER,
      content: iceBreaker,
      isSystemMessage: true,
    });
    
    logger.info('Conversation created from match', {
      conversationId: conversation._id,
      interestId,
      founderId: interest.founder,
      builderId: interest.builder,
    });
    
    return conversation;
  };

/**
 * Get conversation by ID
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Conversation with participants
 * @throws {ApiError} If not found or unauthorized
 */
const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId)
    .populate('founder', 'name email avatarUrl')
    .populate('builder', 'name email avatarUrl')
    .populate('opening', 'title roleType')
    .populate('trial');
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  return conversation;
};

/**
 * Get all conversations for a user
 * 
 * @param {string} userId - User ID
 * @param {Object} [options={}] - Query options
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Promise<Object>} Paginated conversations
 */
const getUserConversations = async (userId, options = {}) => {
  const { status, page = 1, limit = 20 } = options;
  
  const query = {
    participants: userId,
  };
  
  if (status) {
    query.status = status;
  } else {
    // By default, exclude archived
    query.status = { $ne: CONVERSATION_STATUS.ARCHIVED };
  }
  
  const skip = (page - 1) * limit;
  
  const [conversations, total] = await Promise.all([
    Conversation.find(query)
      .populate('founder', 'name email avatarUrl')
      .populate('builder', 'name email avatarUrl')
      .populate('opening', 'title roleType')
      .populate('lastMessage')
      .populate('trial', 'status')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Conversation.countDocuments(query),
  ]);
  
  // Add unread count for each conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        readAt: null,
        isSystemMessage: false,
      });
      return { ...conv, unreadCount };
    })
  );
  
  return {
    conversations: conversationsWithUnread,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

/**
 * Archive a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated conversation
 */
const archiveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  conversation.status = CONVERSATION_STATUS.ARCHIVED;
  conversation.archivedAt = new Date();
  conversation.archivedBy = userId;
  await conversation.save();
  
  logger.info('Conversation archived', { conversationId, userId });
  
  return conversation;
};

/**
 * Unarchive a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated conversation
 */
const unarchiveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  conversation.status = CONVERSATION_STATUS.ACTIVE;
  conversation.archivedAt = null;
  conversation.archivedBy = null;
  await conversation.save();
  
  logger.info('Conversation unarchived', { conversationId, userId });
  
  return conversation;
};

// ============================================
// MESSAGING
// ============================================

/**
 * Send a message in a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender's user ID
 * @param {Object} messageData - Message data
 * @param {string} messageData.content - Message content
 * @param {string} [messageData.messageType='TEXT'] - Message type
 * @param {string} [messageData.attachmentUrl] - Attachment URL
 * @returns {Promise<Object>} Created message
 */
const sendMessage = async (conversationId, senderId, messageData) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  // Verify sender is a participant
  const isParticipant = conversation.participants.some(
    p => p.toString() === senderId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  // Check conversation is active
  if (conversation.status !== CONVERSATION_STATUS.ACTIVE) {
    throw ApiError.badRequest('Cannot send messages to an archived conversation');
  }
  
  // Create message
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content: messageData.content,
    messageType: messageData.messageType || MESSAGE_TYPES.TEXT,
    attachmentUrl: messageData.attachmentUrl || null,
  });
  
  // Update conversation
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  conversation.messageCount = (conversation.messageCount || 0) + 1;
  await conversation.save();
  
  // Populate sender for response
  await message.populate('sender', 'name email avatarUrl');

  // ============================================
  // REAL-TIME SOCKET EMISSIONS
  // ============================================

  // Emit new message to conversation room (excluding sender)
  socketService.emitNewMessage(conversationId, message, senderId);

  // Emit confirmation to sender
  socketService.emitMessageSent(senderId, conversationId, message);

  // Determine recipient
  const recipientId = conversation.participants.find(
    p => p.toString() !== senderId.toString()
  );

  // Create notification for recipient (if they're not in the conversation room)
  if (recipientId) {
    const sender = await User.findById(senderId).select('name avatarUrl');
    try {
      await notificationService.notifyNewMessage({
        userId: recipientId,
        sender: { _id: senderId, name: sender?.name || 'User', avatarUrl: sender?.avatarUrl },
        conversation: { _id: conversationId },
        messagePreview: message.content,
      });
    } catch (notifError) {
      // Don't fail message send if notification fails
      logger.warn('Failed to create message notification', { error: notifError.message });
    }
  }

  logger.info('Message sent', {
    messageId: message._id,
    conversationId,
    senderId,
  });

  return message;
};

/**
 * Get messages in a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} [options={}] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @param {string} [options.before] - Get messages before this message ID
 * @returns {Promise<Object>} Paginated messages
 */
const getMessages = async (conversationId, userId, options = {}) => {
  const { page = 1, limit = 50, before } = options;
  
  // Verify user is participant
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  const query = { conversation: conversationId };
  
  // For cursor-based pagination (loading older messages)
  if (before) {
    const beforeMessage = await Message.findById(before);
    if (beforeMessage) {
      query.createdAt = { $lt: beforeMessage.createdAt };
    }
  }
  
  const skip = before ? 0 : (page - 1) * limit;
  
  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate('sender', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversation: conversationId }),
  ]);
  
  // Reverse to show oldest first in the returned array
  messages.reverse();
  
  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: before ? messages.length === limit : page * limit < total,
    },
  };
};

/**
 * Mark messages as read
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - Reader's user ID
 * @param {string} [upToMessageId] - Mark all messages up to this ID as read
 * @returns {Promise<number>} Number of messages marked as read
 */
const markMessagesAsRead = async (conversationId, userId, upToMessageId = null) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  const query = {
    conversation: conversationId,
    sender: { $ne: userId }, // Only mark other person's messages
    readAt: null,
  };
  
  // If specific message ID provided, mark up to that message
  if (upToMessageId) {
    const upToMessage = await Message.findById(upToMessageId);
    if (upToMessage) {
      query.createdAt = { $lte: upToMessage.createdAt };
    }
  }
  
  const result = await Message.updateMany(query, {
    $set: { readAt: new Date() },
  });

  // Emit read receipt via socket
  if (result.modifiedCount > 0) {
    socketService.emitMessagesRead(conversationId, userId, []);
  }

  logger.info('Messages marked as read', {
    conversationId,
    userId,
    count: result.modifiedCount,
  });

  return result.modifiedCount;
};

/**
 * Get unread message count for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total unread messages
 */
const getUnreadCount = async (userId) => {
  // Get user's active conversations
  const conversations = await Conversation.find({
    participants: userId,
    status: CONVERSATION_STATUS.ACTIVE,
  }).select('_id');
  
  const conversationIds = conversations.map(c => c._id);
  
  // Count unread messages
  const count = await Message.countDocuments({
    conversation: { $in: conversationIds },
    sender: { $ne: userId },
    readAt: null,
    isSystemMessage: false,
  });
  
  return count;
};

/**
 * Get unread count per conversation
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Map of conversationId to unread count
 */
const getUnreadCountPerConversation = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
    status: CONVERSATION_STATUS.ACTIVE,
  }).select('_id');
  
  const conversationIds = conversations.map(c => c._id);
  
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        conversation: { $in: conversationIds },
        sender: { $ne: userId },
        readAt: null,
        isSystemMessage: false,
      },
    },
    {
      $group: {
        _id: '$conversation',
        count: { $sum: 1 },
      },
    },
  ]);
  
  // Convert to object
  const result = {};
  unreadCounts.forEach(item => {
    result[item._id.toString()] = item.count;
  });
  
  return result;
};

// ============================================
// ICE BREAKERS
// ============================================

/**
 * Get a random ice breaker prompt
 * 
 * @returns {string} Ice breaker prompt
 */
const getRandomIceBreaker = () => {
  const index = Math.floor(Math.random() * ICE_BREAKER_PROMPTS.length);
  return ICE_BREAKER_PROMPTS[index];
};

/**
 * Send a new ice breaker prompt to a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID requesting new ice breaker
 * @returns {Promise<Object>} Created ice breaker message
 */
const sendNewIceBreaker = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  const iceBreaker = getRandomIceBreaker();
  
  const message = await Message.create({
    conversation: conversationId,
    messageType: MESSAGE_TYPES.ICE_BREAKER,
    content: iceBreaker,
    isSystemMessage: true,
  });
  
  return message;
};

// ============================================
// TRIAL INTEGRATION
// ============================================

/**
 * Link a trial to a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} trialId - Trial ID
 * @returns {Promise<Object>} Updated conversation
 */
const linkTrial = async (conversationId, trialId) => {
  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { trial: trialId },
    { new: true }
  );
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  logger.info('Trial linked to conversation', { conversationId, trialId });
  
  return conversation;
};

/**
 * Send a trial-related system message
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} messageType - MESSAGE_TYPES.TRIAL_PROPOSAL or TRIAL_UPDATE
 * @param {string} content - Message content
 * @param {Object} [metadata={}] - Additional metadata
 * @returns {Promise<Object>} Created message
 */
const sendTrialMessage = async (conversationId, messageType, content, metadata = {}) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw ApiError.conversationNotFound();
  }

  const message = await Message.create({
    conversation: conversationId,
    messageType,
    content,
    isSystemMessage: true,
    metadata,
  });

  // Update conversation
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Emit trial message to both participants via socket
  socketService.emitToConversation(conversationId, 'new_message', {
    conversationId,
    message: {
      _id: message._id,
      content: message.content,
      messageType: message.messageType,
      isSystemMessage: true,
      createdAt: message.createdAt,
    },
  });

  return message;
};

// ============================================
// CONVERSATION STATS
// ============================================

/**
 * Get conversation statistics
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Conversation statistics
 */
const getConversationStats = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  const [totalMessages, userMessages, unreadCount] = await Promise.all([
    Message.countDocuments({ conversation: conversationId, isSystemMessage: false }),
    Message.countDocuments({ conversation: conversationId, sender: userId }),
    Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: userId },
      readAt: null,
      isSystemMessage: false,
    }),
  ]);
  
  return {
    totalMessages,
    userMessages,
    otherMessages: totalMessages - userMessages,
    unreadCount,
    createdAt: conversation.createdAt,
    lastMessageAt: conversation.lastMessageAt,
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Conversation CRUD
  createConversationFromMatch,
  getConversationById,
  getUserConversations,
  archiveConversation,
  unarchiveConversation,
  
  // Messaging
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getUnreadCount,
  getUnreadCountPerConversation,
  
  // Ice breakers
  getRandomIceBreaker,
  sendNewIceBreaker,
  
  // Trial integration
  linkTrial,
  sendTrialMessage,
  
  // Stats
  getConversationStats,
};
