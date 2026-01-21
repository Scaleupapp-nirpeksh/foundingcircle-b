/**
 * @fileoverview Conversation Controller
 *
 * Handles all conversation/messaging-related HTTP endpoints:
 * - Creating conversations from matches
 * - Sending and receiving messages
 * - Message read status
 * - Ice breaker prompts
 * - Conversation management
 *
 * @module controllers/conversation
 */

const conversationService = require('../services/conversation.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// CONVERSATION CRUD
// ============================================

/**
 * Create a conversation from a mutual match
 *
 * @route POST /api/v1/conversations/from-match/:interestId
 * @access Private (Match participants only)
 *
 * @param {string} req.params.interestId - Interest ID (must be mutual match)
 *
 * @returns {Object} Created conversation
 */
const createConversationFromMatch = asyncHandler(async (req, res) => {
  const { interestId } = req.params;

  const conversation = await conversationService.createConversationFromMatch(interestId);

  return ApiResponse.created('Conversation created', { conversation }).send(res);
});

/**
 * Get conversation by ID
 *
 * @route GET /api/v1/conversations/:id
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 *
 * @returns {Object} Conversation with participants
 */
const getConversationById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const conversation = await conversationService.getConversationById(id, userId);

  return ApiResponse.ok('Conversation retrieved', { conversation }).send(res);
});

/**
 * Get all conversations for current user
 *
 * @route GET /api/v1/conversations
 * @access Private
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 *
 * @returns {Object} Paginated conversations
 */
const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await conversationService.getUserConversations(userId, {
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.conversations,
    result.pagination,
    'Conversations retrieved'
  ).send(res);
});

/**
 * Archive a conversation
 *
 * @route POST /api/v1/conversations/:id/archive
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 *
 * @returns {Object} Updated conversation
 */
const archiveConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const conversation = await conversationService.archiveConversation(id, userId);

  return ApiResponse.ok('Conversation archived', { conversation }).send(res);
});

/**
 * Unarchive a conversation
 *
 * @route POST /api/v1/conversations/:id/unarchive
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 *
 * @returns {Object} Updated conversation
 */
const unarchiveConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const conversation = await conversationService.unarchiveConversation(id, userId);

  return ApiResponse.ok('Conversation unarchived', { conversation }).send(res);
});

// ============================================
// MESSAGING
// ============================================

/**
 * Send a message in a conversation
 *
 * @route POST /api/v1/conversations/:id/messages
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 * @param {string} req.body.content - Message content
 * @param {string} [req.body.messageType='TEXT'] - Message type
 * @param {string} [req.body.attachmentUrl] - Attachment URL
 *
 * @returns {Object} Created message
 */
const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { id } = req.params;
  const { content, messageType, attachmentUrl } = req.body;

  const message = await conversationService.sendMessage(id, senderId, {
    content,
    messageType,
    attachmentUrl,
  });

  return ApiResponse.created('Message sent', { message }).send(res);
});

/**
 * Get messages in a conversation
 *
 * @route GET /api/v1/conversations/:id/messages
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=50] - Items per page
 * @param {string} [req.query.before] - Get messages before this message ID
 *
 * @returns {Object} Paginated messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { page = 1, limit = 50, before } = req.query;

  const result = await conversationService.getMessages(id, userId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    before,
  });

  return ApiResponse.paginated(
    result.messages,
    result.pagination,
    'Messages retrieved'
  ).send(res);
});

/**
 * Mark messages as read
 *
 * @route POST /api/v1/conversations/:id/read
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 * @param {string} [req.body.upToMessageId] - Mark messages up to this ID
 *
 * @returns {Object} Number of messages marked as read
 */
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { upToMessageId } = req.body;

  const count = await conversationService.markMessagesAsRead(id, userId, upToMessageId);

  return ApiResponse.ok('Messages marked as read', { markedAsRead: count }).send(res);
});

/**
 * Get total unread message count for current user
 *
 * @route GET /api/v1/conversations/unread/count
 * @access Private
 *
 * @returns {Object} Total unread count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await conversationService.getUnreadCount(userId);

  return ApiResponse.ok('Unread count retrieved', { unreadCount: count }).send(res);
});

/**
 * Get unread count per conversation
 *
 * @route GET /api/v1/conversations/unread/per-conversation
 * @access Private
 *
 * @returns {Object} Map of conversationId to unread count
 */
const getUnreadCountPerConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const counts = await conversationService.getUnreadCountPerConversation(userId);

  return ApiResponse.ok('Unread counts retrieved', { unreadCounts: counts }).send(res);
});

// ============================================
// ICE BREAKERS
// ============================================

/**
 * Send a new ice breaker to a conversation
 *
 * @route POST /api/v1/conversations/:id/ice-breaker
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 *
 * @returns {Object} Created ice breaker message
 */
const sendNewIceBreaker = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const message = await conversationService.sendNewIceBreaker(id, userId);

  return ApiResponse.created('New ice breaker sent', { message }).send(res);
});

// ============================================
// STATS
// ============================================

/**
 * Get conversation statistics
 *
 * @route GET /api/v1/conversations/:id/stats
 * @access Private (Participants only)
 *
 * @param {string} req.params.id - Conversation ID
 *
 * @returns {Object} Conversation statistics
 */
const getConversationStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const stats = await conversationService.getConversationStats(id, userId);

  return ApiResponse.ok('Conversation statistics retrieved', stats).send(res);
});

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
  sendNewIceBreaker,

  // Stats
  getConversationStats,
};
