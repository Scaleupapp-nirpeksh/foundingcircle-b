/**
 * @fileoverview Conversation Socket Handler
 *
 * Handles real-time conversation events:
 * - Joining/leaving conversation rooms
 * - Typing indicators
 * - Message read receipts
 *
 * @module socket/handlers/conversationHandler
 */

const { SOCKET_EVENTS } = require('../../shared/constants/enums');
const { Conversation } = require('../../modules/models');
const socketService = require('../socketService');

/**
 * Register conversation handlers for a socket
 *
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 */
const registerConversationHandlers = (socket, io) => {
  /**
   * Join a conversation room
   * Validates user is a participant before joining
   */
  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.userId;

      if (!conversationId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Conversation ID is required',
        });
        return;
      }

      // Validate user is a participant
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Conversation not found',
        });
        return;
      }

      const isParticipant =
        conversation.founder.toString() === userId ||
        conversation.builder.toString() === userId;

      if (!isParticipant) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'You are not a participant in this conversation',
        });
        return;
      }

      // Join the conversation room
      socket.join(`conversation:${conversationId}`);

      // Acknowledge join
      socket.emit('joined_conversation', {
        conversationId,
        message: 'Successfully joined conversation',
      });
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to join conversation',
      });
    }
  });

  /**
   * Leave a conversation room
   */
  socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (data) => {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        return;
      }

      socket.leave(`conversation:${conversationId}`);

      socket.emit('left_conversation', {
        conversationId,
        message: 'Successfully left conversation',
      });
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  });

  /**
   * Handle typing start indicator
   */
  socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.userId;
      const userName = socket.user?.name || 'User';

      if (!conversationId) return;

      // Emit to other participants in the conversation
      socketService.emitTyping(conversationId, userId, userName, true);
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  /**
   * Handle typing stop indicator
   */
  socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.userId;
      const userName = socket.user?.name || 'User';

      if (!conversationId) return;

      // Emit to other participants in the conversation
      socketService.emitTyping(conversationId, userId, userName, false);
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });

  /**
   * Handle mark messages as read
   * This is a real-time notification to the other user
   * The actual marking is done via HTTP API
   */
  socket.on(SOCKET_EVENTS.MARK_READ, (data) => {
    try {
      const { conversationId, messageIds } = data;
      const userId = socket.userId;

      if (!conversationId) return;

      // Emit read receipt to other participants
      socketService.emitMessagesRead(conversationId, userId, messageIds || []);
    } catch (error) {
      console.error('Error handling mark read:', error);
    }
  });
};

module.exports = { registerConversationHandlers };
