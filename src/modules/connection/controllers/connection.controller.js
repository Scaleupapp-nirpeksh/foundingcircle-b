/**
 * @fileoverview Connection Request Controller
 *
 * Handles HTTP endpoints for connection requests:
 * - Sending connection requests
 * - Accepting/declining/withdrawing requests
 * - Getting connection requests
 *
 * @module controllers/connection
 */

const connectionService = require('../services/connection.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// SEND CONNECTION REQUEST
// ============================================

/**
 * Send a connection request to another user
 *
 * @route POST /api/v1/connections/request/:userId
 * @access Private
 */
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { userId: recipientId } = req.params;
  const { note, subject, intent, discoverySource } = req.body;

  const request = await connectionService.sendConnectionRequest(senderId, recipientId, {
    note,
    subject,
    intent,
    discoverySource,
  });

  return ApiResponse.created('Connection request sent successfully', { request }).send(res);
});

/**
 * Send a connection request (alternative - targetUserId in body)
 *
 * @route POST /api/v1/connections/request
 * @access Private
 * @body { targetUserId, targetProfileId, targetProfileType, message, intent, subject?, discoverySource? }
 */
const sendConnectionRequestFromBody = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const {
    targetUserId,
    targetProfileId,
    targetProfileType,
    message,
    note,
    subject,
    intent,
    discoverySource,
  } = req.body;

  let recipientId = targetUserId;

  // If targetProfileId is provided, look up the user ID from the profile
  if (!recipientId && targetProfileId) {
    const { FounderProfile, BuilderProfile } = require('../../models');

    let profile;
    if (targetProfileType === 'builder') {
      profile = await BuilderProfile.findById(targetProfileId).select('user');
    } else if (targetProfileType === 'founder') {
      profile = await FounderProfile.findById(targetProfileId).select('user');
    } else {
      // Try both if type not specified
      profile = await BuilderProfile.findById(targetProfileId).select('user');
      if (!profile) {
        profile = await FounderProfile.findById(targetProfileId).select('user');
      }
    }

    if (!profile) {
      return ApiResponse.notFound('Profile not found').send(res);
    }

    recipientId = profile.user;
  }

  if (!recipientId) {
    return ApiResponse.badRequest('targetUserId or targetProfileId is required').send(res);
  }

  const request = await connectionService.sendConnectionRequest(senderId, recipientId, {
    note: note || message, // Support both 'note' and 'message' field names
    subject,
    intent,
    discoverySource,
    targetProfileType,
  });

  return ApiResponse.created('Connection request sent successfully', { request }).send(res);
});

// ============================================
// RESPOND TO REQUESTS
// ============================================

/**
 * Accept a connection request
 *
 * @route POST /api/v1/connections/:id/accept
 * @access Private
 */
const acceptRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: requestId } = req.params;
  const { message } = req.body;

  const result = await connectionService.acceptConnectionRequest(userId, requestId, message);

  return ApiResponse.ok('Connection request accepted - you can now chat!', {
    request: result.request,
    conversation: result.conversation,
  }).send(res);
});

/**
 * Decline a connection request
 *
 * @route POST /api/v1/connections/:id/decline
 * @access Private
 */
const declineRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: requestId } = req.params;
  const { message } = req.body;

  const request = await connectionService.declineConnectionRequest(userId, requestId, message);

  return ApiResponse.ok('Connection request declined', { request }).send(res);
});

/**
 * Withdraw a connection request (sender action)
 *
 * @route POST /api/v1/connections/:id/withdraw
 * @access Private
 */
const withdrawRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: requestId } = req.params;

  const request = await connectionService.withdrawConnectionRequest(userId, requestId);

  return ApiResponse.ok('Connection request withdrawn', { request }).send(res);
});

// ============================================
// GET REQUESTS
// ============================================

/**
 * Get received connection requests
 *
 * @route GET /api/v1/connections/received
 * @access Private
 */
const getReceivedRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await connectionService.getReceivedRequests(userId, {
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.requests,
    result.pagination,
    'Received connection requests retrieved'
  ).send(res);
});

/**
 * Get sent connection requests
 *
 * @route GET /api/v1/connections/sent
 * @access Private
 */
const getSentRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await connectionService.getSentRequests(userId, {
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    result.requests,
    result.pagination,
    'Sent connection requests retrieved'
  ).send(res);
});

/**
 * Get pending requests count
 *
 * @route GET /api/v1/connections/pending/count
 * @access Private
 */
const getPendingCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await connectionService.getPendingRequestsCount(userId);

  return ApiResponse.ok('Pending requests count retrieved', { count }).send(res);
});

/**
 * Get connection request by ID
 *
 * @route GET /api/v1/connections/:id
 * @access Private
 */
const getRequestById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: requestId } = req.params;

  const request = await connectionService.getRequestById(requestId, userId);

  return ApiResponse.ok('Connection request retrieved', { request }).send(res);
});

/**
 * Check connection status with another user
 *
 * @route GET /api/v1/connections/check/:userId
 * @access Private
 */
const checkConnection = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId } = req.params;

  const result = await connectionService.checkConnection(currentUserId, userId);

  return ApiResponse.ok('Connection status checked', result).send(res);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  sendConnectionRequest,
  sendConnectionRequestFromBody,
  acceptRequest,
  declineRequest,
  withdrawRequest,
  getReceivedRequests,
  getSentRequests,
  getPendingCount,
  getRequestById,
  checkConnection,
};
