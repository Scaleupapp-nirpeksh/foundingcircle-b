/**
 * @fileoverview Socket Authentication Middleware
 *
 * Handles JWT authentication for socket.io connections.
 *
 * @module socket/socketAuth
 */

const jwt = require('jsonwebtoken');
const { config } = require('../shared/config');
const { User } = require('../modules/models');
const { USER_STATUS } = require('../shared/constants/enums');

/**
 * Socket authentication middleware
 * Verifies JWT token from handshake and attaches user to socket
 *
 * @param {Object} socket - Socket.io socket instance
 * @param {Function} next - Next function
 */
const socketAuth = async (socket, next) => {
  try {
    // Extract token from handshake
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required. No token provided.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token has expired. Please reconnect.'));
      }
      return next(new Error('Invalid token. Authentication failed.'));
    }

    // Find user
    const user = await User.findById(decoded.userId).select('_id name email userType status');

    if (!user) {
      return next(new Error('User not found.'));
    }

    // Check if user is active
    if (user.status !== USER_STATUS.ACTIVE) {
      return next(new Error('Account is not active.'));
    }

    // Attach user info to socket
    socket.userId = user._id.toString();
    socket.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication failed.'));
  }
};

/**
 * Validate socket is still authenticated
 * Can be used periodically to ensure token hasn't expired
 *
 * @param {Object} socket - Socket.io socket instance
 * @returns {boolean} Whether socket is still valid
 */
const validateSocketSession = async (socket) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return false;

    jwt.verify(token, config.jwt.accessSecret);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  socketAuth,
  validateSocketSession,
};
