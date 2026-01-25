/**
 * @fileoverview Connection Request Service
 *
 * Handles direct outreach/connection requests between users:
 * - Sending connection requests with notes
 * - Accepting/declining requests
 * - Creating conversations after acceptance
 *
 * @module services/connection
 */

const { ConnectionRequest, CONNECTION_STATUS, CONNECTION_TYPE } = require('../models/ConnectionRequest');
const { User, Conversation, FounderProfile, BuilderProfile } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const { CONVERSATION_STATUS, USER_TYPES } = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');
const socketService = require('../../../socket/socketService');
const notificationService = require('../../notification/services/notification.service');

// ============================================
// SEND CONNECTION REQUEST
// ============================================

/**
 * Send a connection request to another user
 *
 * @param {string} senderId - Sender's user ID
 * @param {string} recipientId - Recipient's user ID
 * @param {Object} data - Request data
 * @param {string} data.note - Note/message to recipient
 * @param {string} [data.subject] - Subject line
 * @param {string} [data.intent] - Intent of connection
 * @param {string} [data.discoverySource] - How sender found recipient
 * @returns {Promise<Object>} Created connection request
 */
const sendConnectionRequest = async (senderId, recipientId, data) => {
  // Validate sender and recipient exist
  const [sender, recipient] = await Promise.all([
    User.findById(senderId),
    User.findById(recipientId),
  ]);

  if (!sender) {
    throw ApiError.notFound('Sender not found');
  }

  if (!recipient) {
    throw ApiError.notFound('Recipient not found');
  }

  // Can't send to yourself
  if (senderId.toString() === recipientId.toString()) {
    throw ApiError.badRequest('Cannot send connection request to yourself');
  }

  // Check if connection already exists
  const existingConnection = await ConnectionRequest.existsBetween(senderId, recipientId);
  if (existingConnection) {
    throw ApiError.conflict('A connection request already exists with this user');
  }

  // Determine connection type based on user types
  let connectionType;
  const senderType = sender.activeRole || sender.userType;
  const recipientType = recipient.activeRole || recipient.userType;

  if (senderType === USER_TYPES.BUILDER && recipientType === USER_TYPES.FOUNDER) {
    connectionType = CONNECTION_TYPE.BUILDER_TO_FOUNDER;
  } else if (senderType === USER_TYPES.FOUNDER && recipientType === USER_TYPES.FOUNDER) {
    connectionType = CONNECTION_TYPE.FOUNDER_TO_FOUNDER;
  } else if (senderType === USER_TYPES.BUILDER && recipientType === USER_TYPES.BUILDER) {
    connectionType = CONNECTION_TYPE.BUILDER_TO_BUILDER;
  } else if (senderType === USER_TYPES.FOUNDER && recipientType === USER_TYPES.BUILDER) {
    connectionType = CONNECTION_TYPE.FOUNDER_TO_BUILDER;
  } else {
    connectionType = CONNECTION_TYPE.BUILDER_TO_FOUNDER; // Default
  }

  // Create connection request
  const connectionRequest = await ConnectionRequest.create({
    sender: senderId,
    recipient: recipientId,
    connectionType,
    note: data.note,
    subject: data.subject || null,
    intent: data.intent || 'COLLABORATION',
    discoverySource: data.discoverySource || 'SEARCH',
  });

  // Notify recipient via socket
  socketService.emitToUser(recipientId, 'new_connection_request', {
    requestId: connectionRequest._id,
    sender: {
      _id: sender._id,
      name: sender.name,
      profilePhoto: sender.profilePhoto,
      userType: senderType,
    },
    subject: data.subject,
    intent: data.intent,
    createdAt: connectionRequest.createdAt,
  });

  // Create notification for recipient
  try {
    await notificationService.createNotification({
      recipient: recipientId,
      type: 'CONNECTION_REQUEST',
      title: 'New Connection Request',
      message: `${sender.name} wants to connect with you`,
      data: {
        requestId: connectionRequest._id,
        senderId,
      },
    });
  } catch (notifError) {
    logger.warn('Failed to create connection request notification', { error: notifError.message });
  }

  logger.info('Connection request sent', {
    requestId: connectionRequest._id,
    senderId,
    recipientId,
    connectionType,
  });

  return connectionRequest;
};

// ============================================
// RESPOND TO CONNECTION REQUEST
// ============================================

/**
 * Accept a connection request
 *
 * @param {string} userId - Recipient's user ID
 * @param {string} requestId - Connection request ID
 * @param {string} [responseMessage] - Optional response message
 * @returns {Promise<Object>} Updated request with conversation
 */
const acceptConnectionRequest = async (userId, requestId, responseMessage = null) => {
  const request = await ConnectionRequest.findById(requestId)
    .populate('sender', 'name profilePhoto userType activeRole');

  if (!request) {
    throw ApiError.notFound('Connection request not found');
  }

  // Verify user is the recipient
  if (request.recipient.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only respond to your own connection requests');
  }

  if (request.status !== CONNECTION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot accept - request is ${request.status}`);
  }

  // Accept the request
  request.status = CONNECTION_STATUS.ACCEPTED;
  request.respondedAt = new Date();
  if (responseMessage) {
    request.responseMessage = responseMessage;
  }

  // Create conversation
  const recipient = await User.findById(userId);
  const conversation = await Conversation.create({
    participants: [request.sender._id, userId],
    connectionRequest: request._id,
    status: CONVERSATION_STATUS.ACTIVE,
    metadata: {
      connectionType: request.connectionType,
      intent: request.intent,
    },
  });

  request.conversation = conversation._id;
  await request.save();

  // Notify sender via socket
  socketService.emitToUser(request.sender._id.toString(), 'connection_accepted', {
    requestId: request._id,
    recipient: {
      _id: userId,
      name: recipient.name,
      profilePhoto: recipient.profilePhoto,
    },
    conversationId: conversation._id,
  });

  // Create notification for sender
  try {
    await notificationService.createNotification({
      recipient: request.sender._id,
      type: 'CONNECTION_ACCEPTED',
      title: 'Connection Accepted!',
      message: `${recipient.name} accepted your connection request`,
      data: {
        requestId: request._id,
        conversationId: conversation._id,
      },
    });
  } catch (notifError) {
    logger.warn('Failed to create connection accepted notification', { error: notifError.message });
  }

  // If founder-to-founder or founder-to-builder, suggest creating an opening
  if (request.connectionType === CONNECTION_TYPE.FOUNDER_TO_BUILDER) {
    const founderProfile = await FounderProfile.findOne({ user: request.sender._id });
    const hasOpenings = founderProfile?.openingCount > 0;

    if (!hasOpenings) {
      // Add system message suggesting to create an opening
      const { Message } = require('../../models');
      await Message.create({
        conversation: conversation._id,
        messageType: 'SYSTEM',
        content: `💡 Tip: You haven't created any openings yet. Consider creating an opening to track this potential hire and manage the recruitment process better.`,
        isSystemMessage: true,
        metadata: {
          suggestionType: 'CREATE_OPENING',
          userId: request.sender._id,
        },
      });
    }
  }

  logger.info('Connection request accepted', {
    requestId,
    senderId: request.sender._id,
    recipientId: userId,
    conversationId: conversation._id,
  });

  return { request, conversation };
};

/**
 * Decline a connection request
 *
 * @param {string} userId - Recipient's user ID
 * @param {string} requestId - Connection request ID
 * @param {string} [responseMessage] - Optional decline reason
 * @returns {Promise<Object>} Updated request
 */
const declineConnectionRequest = async (userId, requestId, responseMessage = null) => {
  const request = await ConnectionRequest.findById(requestId);

  if (!request) {
    throw ApiError.notFound('Connection request not found');
  }

  // Verify user is the recipient
  if (request.recipient.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only respond to your own connection requests');
  }

  if (request.status !== CONNECTION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot decline - request is ${request.status}`);
  }

  // Decline the request
  request.status = CONNECTION_STATUS.DECLINED;
  request.respondedAt = new Date();
  if (responseMessage) {
    request.responseMessage = responseMessage;
  }
  await request.save();

  logger.info('Connection request declined', {
    requestId,
    senderId: request.sender,
    recipientId: userId,
  });

  return request;
};

/**
 * Withdraw a connection request (sender action)
 *
 * @param {string} userId - Sender's user ID
 * @param {string} requestId - Connection request ID
 * @returns {Promise<Object>} Updated request
 */
const withdrawConnectionRequest = async (userId, requestId) => {
  const request = await ConnectionRequest.findById(requestId);

  if (!request) {
    throw ApiError.notFound('Connection request not found');
  }

  // Verify user is the sender
  if (request.sender.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only withdraw your own connection requests');
  }

  if (request.status !== CONNECTION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot withdraw - request is ${request.status}`);
  }

  request.status = CONNECTION_STATUS.WITHDRAWN;
  await request.save();

  logger.info('Connection request withdrawn', { requestId, userId });

  return request;
};

// ============================================
// GET CONNECTION REQUESTS
// ============================================

/**
 * Get received connection requests
 *
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated requests with sender profile details
 */
const getReceivedRequests = async (userId, options = {}) => {
  const { status, page = 1, limit = 20 } = options;

  const query = { recipient: userId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    ConnectionRequest.find(query)
      .populate('sender', 'name email profilePhoto userType activeRole')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ConnectionRequest.countDocuments(query),
  ]);

  // Enrich requests with sender profile details
  const enrichedRequests = await Promise.all(
    requests.map(async (request) => {
      if (!request.sender) return request;

      const senderType = (request.sender.activeRole || request.sender.userType || '').toLowerCase();
      let senderProfile = null;

      if (senderType === 'builder') {
        senderProfile = await BuilderProfile.findOne({ user: request.sender._id })
          .select('displayName headline bio skills hoursPerWeek riskAppetite experienceLevel location remotePreference isOpenToOpportunities')
          .lean();
      } else if (senderType === 'founder') {
        senderProfile = await FounderProfile.findOne({ user: request.sender._id })
          .select('startupName tagline description industry startupStage location hoursPerWeek isSolo equityRange cashRange remotePreference')
          .lean();
      }

      return {
        ...request,
        senderProfile,
      };
    })
  );

  return {
    requests: enrichedRequests,
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
 * Get sent connection requests
 *
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated requests with recipient profile details
 */
const getSentRequests = async (userId, options = {}) => {
  const { status, page = 1, limit = 20 } = options;

  const query = { sender: userId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    ConnectionRequest.find(query)
      .populate('recipient', 'name email profilePhoto userType activeRole')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ConnectionRequest.countDocuments(query),
  ]);

  // Enrich requests with recipient profile details
  const enrichedRequests = await Promise.all(
    requests.map(async (request) => {
      if (!request.recipient) return request;

      const recipientType = (request.recipient.activeRole || request.recipient.userType || '').toLowerCase();
      let recipientProfile = null;

      if (recipientType === 'builder') {
        recipientProfile = await BuilderProfile.findOne({ user: request.recipient._id })
          .select('displayName headline bio skills hoursPerWeek riskAppetite experienceLevel location remotePreference isOpenToOpportunities')
          .lean();
      } else if (recipientType === 'founder') {
        recipientProfile = await FounderProfile.findOne({ user: request.recipient._id })
          .select('startupName tagline description industry startupStage location hoursPerWeek isSolo equityRange cashRange remotePreference')
          .lean();
      }

      return {
        ...request,
        recipientProfile,
      };
    })
  );

  return {
    requests: enrichedRequests,
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
 * Get pending requests count for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count
 */
const getPendingRequestsCount = async (userId) => {
  return ConnectionRequest.countDocuments({
    recipient: userId,
    status: CONNECTION_STATUS.PENDING,
  });
};

/**
 * Get connection request by ID
 *
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Connection request with profile details
 */
const getRequestById = async (requestId, userId) => {
  const request = await ConnectionRequest.findById(requestId)
    .populate('sender', 'name email profilePhoto userType activeRole')
    .populate('recipient', 'name email profilePhoto userType activeRole')
    .populate('conversation');

  if (!request) {
    throw ApiError.notFound('Connection request not found');
  }

  // Verify user is part of this request
  const isSender = request.sender._id.toString() === userId.toString();
  const isRecipient = request.recipient._id.toString() === userId.toString();

  if (!isSender && !isRecipient) {
    throw ApiError.forbidden('You are not part of this connection request');
  }

  // Mark as viewed if recipient is viewing
  if (isRecipient && !request.viewedAt) {
    request.viewedAt = new Date();
    await request.save();
  }

  // Fetch profile details for both sender and recipient
  const requestObj = request.toObject();

  // Sender profile
  const senderType = (request.sender.activeRole || request.sender.userType || '').toLowerCase();
  if (senderType === 'builder') {
    requestObj.senderProfile = await BuilderProfile.findOne({ user: request.sender._id })
      .select('displayName headline bio skills hoursPerWeek riskAppetite experienceLevel location remotePreference isOpenToOpportunities')
      .lean();
  } else if (senderType === 'founder') {
    requestObj.senderProfile = await FounderProfile.findOne({ user: request.sender._id })
      .select('startupName tagline description industry startupStage location hoursPerWeek isSolo equityRange cashRange remotePreference')
      .lean();
  }

  // Recipient profile
  const recipientType = (request.recipient.activeRole || request.recipient.userType || '').toLowerCase();
  if (recipientType === 'builder') {
    requestObj.recipientProfile = await BuilderProfile.findOne({ user: request.recipient._id })
      .select('displayName headline bio skills hoursPerWeek riskAppetite experienceLevel location remotePreference isOpenToOpportunities')
      .lean();
  } else if (recipientType === 'founder') {
    requestObj.recipientProfile = await FounderProfile.findOne({ user: request.recipient._id })
      .select('startupName tagline description industry startupStage location hoursPerWeek isSolo equityRange cashRange remotePreference')
      .lean();
  }

  return requestObj;
};

/**
 * Check if connection exists between two users
 *
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<Object>} Connection status
 */
const checkConnection = async (userId1, userId2) => {
  const request = await ConnectionRequest.findOne({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 },
    ],
  }).sort({ createdAt: -1 });

  return {
    hasConnection: !!request && request.status === CONNECTION_STATUS.ACCEPTED,
    hasPendingRequest: !!request && request.status === CONNECTION_STATUS.PENDING,
    request: request || null,
  };
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Send request
  sendConnectionRequest,

  // Respond to request
  acceptConnectionRequest,
  declineConnectionRequest,
  withdrawConnectionRequest,

  // Get requests
  getReceivedRequests,
  getSentRequests,
  getPendingRequestsCount,
  getRequestById,
  checkConnection,

  // Constants
  CONNECTION_STATUS,
  CONNECTION_TYPE,
};
