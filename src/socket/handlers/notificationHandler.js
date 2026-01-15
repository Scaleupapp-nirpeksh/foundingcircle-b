/**
 * @fileoverview Notification Socket Handler
 *
 * Handles real-time notification events:
 * - Subscribing to user notifications
 * - Mark notifications as read
 *
 * @module socket/handlers/notificationHandler
 */

/**
 * Register notification handlers for a socket
 *
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 */
const registerNotificationHandlers = (socket, io) => {
  /**
   * Mark notification as read (real-time sync)
   */
  socket.on('notification_read', (data) => {
    try {
      const { notificationId } = data;
      const userId = socket.userId;

      if (!notificationId) return;

      // Broadcast to other devices of the same user
      socket.to(`user:${userId}`).emit('notification_marked_read', {
        notificationId,
      });
    } catch (error) {
      console.error('Error handling notification read:', error);
    }
  });

  /**
   * Mark all notifications as read
   */
  socket.on('notifications_read_all', () => {
    try {
      const userId = socket.userId;

      // Broadcast to other devices of the same user
      socket.to(`user:${userId}`).emit('all_notifications_marked_read', {
        userId,
        readAt: new Date(),
      });
    } catch (error) {
      console.error('Error handling notifications read all:', error);
    }
  });

  /**
   * Request current unread count
   * Response will be sent via the notification service
   */
  socket.on('get_unread_count', async () => {
    try {
      // This will be handled by the notification service
      // when it's integrated. For now, just acknowledge.
      socket.emit('unread_count_requested', {
        message: 'Fetching unread count...',
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  });
};

module.exports = { registerNotificationHandlers };
