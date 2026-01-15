/**
 * @fileoverview Conversation Routes
 *
 * Defines all conversation/messaging-related API endpoints.
 *
 * @module routes/conversation
 */

const express = require('express');
const router = express.Router();

const conversationController = require('../controllers/conversation.controller');
const { auth } = require('../middleware/auth');

// ============================================
// UNREAD COUNTS (Must be before /:id routes)
// ============================================

/**
 * @route   GET /api/v1/conversations/unread/count
 * @desc    Get total unread message count for current user
 * @access  Private
 */
router.get('/unread/count', auth, conversationController.getUnreadCount);

/**
 * @route   GET /api/v1/conversations/unread/per-conversation
 * @desc    Get unread count per conversation
 * @access  Private
 */
router.get(
  '/unread/per-conversation',
  auth,
  conversationController.getUnreadCountPerConversation
);

// ============================================
// CONVERSATION CREATION
// ============================================

/**
 * @route   POST /api/v1/conversations/from-match/:interestId
 * @desc    Create a conversation from a mutual match
 * @access  Private (Match participants only)
 */
router.post(
  '/from-match/:interestId',
  auth,
  conversationController.createConversationFromMatch
);

// ============================================
// CONVERSATION LIST
// ============================================

/**
 * @route   GET /api/v1/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 * @query   { status?, page?, limit? }
 */
router.get('/', auth, conversationController.getUserConversations);

// ============================================
// CONVERSATION BY ID ROUTES
// ============================================

/**
 * @route   GET /api/v1/conversations/:id
 * @desc    Get conversation by ID
 * @access  Private (Participants only)
 */
router.get('/:id', auth, conversationController.getConversationById);

/**
 * @route   GET /api/v1/conversations/:id/stats
 * @desc    Get conversation statistics
 * @access  Private (Participants only)
 */
router.get('/:id/stats', auth, conversationController.getConversationStats);

/**
 * @route   POST /api/v1/conversations/:id/archive
 * @desc    Archive a conversation
 * @access  Private (Participants only)
 */
router.post('/:id/archive', auth, conversationController.archiveConversation);

/**
 * @route   POST /api/v1/conversations/:id/unarchive
 * @desc    Unarchive a conversation
 * @access  Private (Participants only)
 */
router.post('/:id/unarchive', auth, conversationController.unarchiveConversation);

// ============================================
// MESSAGING ROUTES
// ============================================

/**
 * @route   GET /api/v1/conversations/:id/messages
 * @desc    Get messages in a conversation
 * @access  Private (Participants only)
 * @query   { page?, limit?, before? }
 */
router.get('/:id/messages', auth, conversationController.getMessages);

/**
 * @route   POST /api/v1/conversations/:id/messages
 * @desc    Send a message in a conversation
 * @access  Private (Participants only)
 * @body    { content: string, messageType?: string, attachmentUrl?: string }
 */
router.post('/:id/messages', auth, conversationController.sendMessage);

/**
 * @route   POST /api/v1/conversations/:id/read
 * @desc    Mark messages as read
 * @access  Private (Participants only)
 * @body    { upToMessageId?: string }
 */
router.post('/:id/read', auth, conversationController.markMessagesAsRead);

// ============================================
// ICE BREAKER ROUTES
// ============================================

/**
 * @route   POST /api/v1/conversations/:id/ice-breaker
 * @desc    Send a new ice breaker to a conversation
 * @access  Private (Participants only)
 */
router.post('/:id/ice-breaker', auth, conversationController.sendNewIceBreaker);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
