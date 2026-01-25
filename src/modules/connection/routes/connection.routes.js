/**
 * @fileoverview Connection Request Routes
 *
 * Defines all connection request-related API endpoints.
 *
 * @module routes/connection
 */

const express = require('express');
const router = express.Router();

const connectionController = require('../controllers/connection.controller');
const { auth, requireCompleteProfile } = require('../../../shared/middleware/auth');

// ============================================
// GET REQUESTS
// ============================================

/**
 * @route   GET /api/v1/connections/received
 * @desc    Get received connection requests
 * @access  Private
 * @query   { status?, page?, limit? }
 */
router.get('/received', auth, connectionController.getReceivedRequests);

/**
 * @route   GET /api/v1/connections/sent
 * @desc    Get sent connection requests
 * @access  Private
 * @query   { status?, page?, limit? }
 */
router.get('/sent', auth, connectionController.getSentRequests);

/**
 * @route   GET /api/v1/connections/pending/count
 * @desc    Get pending requests count
 * @access  Private
 */
router.get('/pending/count', auth, connectionController.getPendingCount);

/**
 * @route   GET /api/v1/connections/check/:userId
 * @desc    Check connection status with another user
 * @access  Private
 */
router.get('/check/:userId', auth, connectionController.checkConnection);

/**
 * @route   GET /api/v1/connections/:id
 * @desc    Get connection request by ID
 * @access  Private
 */
router.get('/:id', auth, connectionController.getRequestById);

// ============================================
// SEND REQUEST
// ============================================

/**
 * @route   POST /api/v1/connections/request
 * @desc    Send a connection request (targetUserId in body)
 * @access  Private (requires complete profile)
 * @body    { targetUserId | targetProfileId, targetProfileType?, message | note, subject?, intent?, discoverySource? }
 */
router.post(
  '/request',
  auth,
  requireCompleteProfile,
  connectionController.sendConnectionRequestFromBody
);

/**
 * @route   POST /api/v1/connections/request/:userId
 * @desc    Send a connection request to another user
 * @access  Private (requires complete profile)
 * @body    { note, subject?, intent?, discoverySource? }
 */
router.post(
  '/request/:userId',
  auth,
  requireCompleteProfile,
  connectionController.sendConnectionRequest
);

// ============================================
// RESPOND TO REQUESTS
// ============================================

/**
 * @route   POST /api/v1/connections/:id/accept
 * @desc    Accept a connection request
 * @access  Private
 * @body    { message? }
 */
router.post('/:id/accept', auth, connectionController.acceptRequest);

/**
 * @route   POST /api/v1/connections/:id/decline
 * @desc    Decline a connection request
 * @access  Private
 * @body    { message? }
 */
router.post('/:id/decline', auth, connectionController.declineRequest);

/**
 * @route   POST /api/v1/connections/:id/withdraw
 * @desc    Withdraw a sent connection request
 * @access  Private
 */
router.post('/:id/withdraw', auth, connectionController.withdrawRequest);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
