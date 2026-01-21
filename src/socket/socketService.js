/**
 * @fileoverview Socket Service
 *
 * Singleton service for emitting socket events from anywhere in the application.
 * This allows services to emit real-time events without direct socket.io access.
 *
 * @module socket/socketService
 */

const { SOCKET_EVENTS } = require('../shared/constants/enums');

// ============================================
// SOCKET SERVICE SINGLETON
// ============================================

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  /**
   * Initialize the socket service with socket.io instance
   * @param {Object} io - Socket.io server instance
   */
  initialize(io) {
    this.io = io;
    console.log('🔌 SocketService initialized');
  }

  /**
   * Check if socket service is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.io !== null;
  }

  /**
   * Register a user's socket connection
   * @param {string} userId - User ID
   * @param {string} socketId - Socket ID
   */
  registerUserSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  /**
   * Unregister a user's socket connection
   * @param {string} userId - User ID
   * @param {string} socketId - Socket ID
   */
  unregisterUserSocket(userId, socketId) {
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socketId);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Check if a user is currently online
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  isUserOnline(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  /**
   * Get all socket IDs for a user
   * @param {string} userId - User ID
   * @returns {string[]} Array of socket IDs
   */
  getUserSocketIds(userId) {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  // ============================================
  // ROOM MANAGEMENT
  // ============================================

  /**
   * Join a socket to a room
   * @param {string} socketId - Socket ID
   * @param {string} room - Room name
   */
  joinRoom(socketId, room) {
    if (!this.io) return;
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(room);
    }
  }

  /**
   * Leave a room
   * @param {string} socketId - Socket ID
   * @param {string} room - Room name
   */
  leaveRoom(socketId, room) {
    if (!this.io) return;
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(room);
    }
  }

  // ============================================
  // EMIT METHODS
  // ============================================

  /**
   * Emit to a specific user (all their connected sockets)
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToUser(userId, event, data) {
    if (!this.io) {
      console.warn('SocketService not initialized, cannot emit to user');
      return;
    }
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit to a conversation room
   * @param {string} conversationId - Conversation ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToConversation(conversationId, event, data) {
    if (!this.io) {
      console.warn('SocketService not initialized, cannot emit to conversation');
      return;
    }
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Emit to multiple users
   * @param {string[]} userIds - Array of user IDs
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToUsers(userIds, event, data) {
    if (!this.io) {
      console.warn('SocketService not initialized, cannot emit to users');
      return;
    }
    userIds.forEach((userId) => {
      this.emitToUser(userId, event, data);
    });
  }

  /**
   * Broadcast to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(event, data) {
    if (!this.io) {
      console.warn('SocketService not initialized, cannot broadcast');
      return;
    }
    this.io.emit(event, data);
  }

  // ============================================
  // CONVERSATION EVENTS
  // ============================================

  /**
   * Emit new message event
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message data
   * @param {string} senderId - Sender user ID (to exclude from receiving)
   */
  emitNewMessage(conversationId, message, senderId) {
    if (!this.io) return;

    const eventData = {
      conversationId,
      message: {
        _id: message._id,
        content: message.content,
        messageType: message.messageType,
        attachmentUrl: message.attachmentUrl,
        sender: message.sender,
        createdAt: message.createdAt,
      },
    };

    // Emit to conversation room (excluding sender)
    this.io
      .to(`conversation:${conversationId}`)
      .except(`user:${senderId}`)
      .emit(SOCKET_EVENTS.NEW_MESSAGE, eventData);
  }

  /**
   * Emit message sent confirmation to sender
   * @param {string} userId - Sender user ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message data
   */
  emitMessageSent(userId, conversationId, message) {
    this.emitToUser(userId, SOCKET_EVENTS.MESSAGE_SENT, {
      conversationId,
      message: {
        _id: message._id,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt,
      },
    });
  }

  /**
   * Emit typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User who is typing
   * @param {string} userName - Display name
   * @param {boolean} isTyping - Whether typing or stopped
   */
  emitTyping(conversationId, userId, userName, isTyping) {
    if (!this.io) return;

    const event = isTyping ? SOCKET_EVENTS.USER_TYPING : SOCKET_EVENTS.USER_STOPPED_TYPING;
    this.io
      .to(`conversation:${conversationId}`)
      .except(`user:${userId}`)
      .emit(event, {
        conversationId,
        userId,
        userName,
      });
  }

  /**
   * Emit messages read event
   * @param {string} conversationId - Conversation ID
   * @param {string} readByUserId - User who read the messages
   * @param {string[]} messageIds - Array of message IDs that were read
   */
  emitMessagesRead(conversationId, readByUserId, messageIds) {
    if (!this.io) return;

    this.io
      .to(`conversation:${conversationId}`)
      .except(`user:${readByUserId}`)
      .emit(SOCKET_EVENTS.MESSAGES_READ, {
        conversationId,
        readByUserId,
        messageIds,
        readAt: new Date(),
      });
  }

  // ============================================
  // NOTIFICATION EVENTS
  // ============================================

  /**
   * Emit new notification to user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  emitNotification(userId, notification) {
    this.emitToUser(userId, SOCKET_EVENTS.NEW_NOTIFICATION, {
      notification: {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    });
  }

  /**
   * Emit unread count update
   * @param {string} userId - User ID
   * @param {Object} counts - Unread counts object
   */
  emitUnreadCountUpdate(userId, counts) {
    this.emitToUser(userId, 'unread_count_updated', counts);
  }

  // ============================================
  // INTEREST EVENTS
  // ============================================

  /**
   * Emit new interest notification to founder
   * @param {string} founderId - Founder user ID
   * @param {Object} interest - Interest data
   */
  emitNewInterest(founderId, interest) {
    this.emitToUser(founderId, SOCKET_EVENTS.NEW_INTEREST, {
      interest: {
        _id: interest._id,
        builder: interest.builder,
        opening: interest.opening,
        builderNote: interest.builderNote,
        createdAt: interest.createdAt,
      },
    });
  }

  /**
   * Emit shortlisted notification to builder
   * @param {string} builderId - Builder user ID
   * @param {Object} data - Shortlist data
   */
  emitBuilderShortlisted(builderId, data) {
    this.emitToUser(builderId, 'builder_shortlisted', {
      interestId: data.interestId,
      founderId: data.founderId,
      founderName: data.founderName,
      openingId: data.openingId,
      openingTitle: data.openingTitle,
    });
  }

  // ============================================
  // MATCH EVENTS
  // ============================================

  /**
   * Emit new match notification
   * @param {string} userId - User ID
   * @param {Object} match - Match data
   */
  emitNewMatch(userId, match) {
    this.emitToUser(userId, SOCKET_EVENTS.NEW_MATCH, {
      match: {
        _id: match._id,
        founder: match.founder,
        builder: match.builder,
        opening: match.opening,
        compatibilityScore: match.compatibilityScore,
        matchedAt: match.matchedAt,
      },
    });
  }

  // ============================================
  // TRIAL EVENTS
  // ============================================

  /**
   * Emit trial update
   * @param {string} userId - User ID
   * @param {Object} trial - Trial data
   * @param {string} updateType - Type of update
   */
  emitTrialUpdate(userId, trial, updateType) {
    this.emitToUser(userId, SOCKET_EVENTS.TRIAL_UPDATE, {
      updateType,
      trial: {
        _id: trial._id,
        status: trial.status,
        conversationId: trial.conversation,
        durationDays: trial.durationDays,
        goal: trial.goal,
        startedAt: trial.startedAt,
        endsAt: trial.endsAt,
      },
    });
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

const socketService = new SocketService();

module.exports = socketService;
