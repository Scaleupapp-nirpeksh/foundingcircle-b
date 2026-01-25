/**
 * @fileoverview Socket.io Setup and Configuration
 *
 * Main entry point for WebSocket functionality.
 * Initializes socket.io, sets up authentication, and registers handlers.
 *
 * @module socket
 */

const { Server } = require('socket.io');
const { socketAuth } = require('./socketAuth');
const socketService = require('./socketService');
const { registerConversationHandlers } = require('./handlers/conversationHandler');
const { registerNotificationHandlers } = require('./handlers/notificationHandler');
const { SOCKET_EVENTS } = require('../shared/constants/enums');

/**
 * Initialize Socket.io with the HTTP server
 *
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.io server instance
 */
const initializeSocket = (server) => {
  // Parse CORS origins from environment
  const getAllowedOrigins = () => {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin) return '*';
    return corsOrigin.split(',').map(o => o.trim());
  };

  // Create Socket.io server with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = getAllowedOrigins();

        // If wildcard, allow all
        if (allowedOrigins === '*') return callback(null, true);

        // Check if origin is allowed or is a lovable.app subdomain
        if (allowedOrigins.includes(origin) || origin.endsWith('.lovable.app')) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Initialize the socket service with io instance
  socketService.initialize(io);

  // Apply authentication middleware
  io.use(socketAuth);

  // ============================================
  // CONNECTION HANDLING
  // ============================================

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const userId = socket.userId;
    const userName = socket.user?.name || 'Unknown';

    console.log(`🔌 Socket connected: ${socket.id} (User: ${userName})`);

    // Register user socket and join user room
    socketService.registerUserSocket(userId, socket.id);
    socket.join(`user:${userId}`);

    // ============================================
    // REGISTER EVENT HANDLERS
    // ============================================

    registerConversationHandlers(socket, io);
    registerNotificationHandlers(socket, io);

    // ============================================
    // CONNECTION EVENTS
    // ============================================

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to FoundingCircle',
      userId,
      socketId: socket.id,
    });

    // Handle ping for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // ============================================
    // DISCONNECTION HANDLING
    // ============================================

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);

      // Unregister user socket
      socketService.unregisterUserSocket(userId, socket.id);

      // Leave all rooms
      socket.rooms.forEach((room) => {
        socket.leave(room);
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error.message);
    });
  });

  // ============================================
  // GLOBAL ERROR HANDLING
  // ============================================

  io.engine.on('connection_error', (err) => {
    console.error('Socket.io connection error:', err.message);
  });

  return io;
};

/**
 * Get the socket service instance
 * @returns {Object} Socket service
 */
const getSocketService = () => socketService;

module.exports = {
  initializeSocket,
  getSocketService,
  socketService,
};
