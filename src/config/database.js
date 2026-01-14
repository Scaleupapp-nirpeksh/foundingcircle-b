/**
 * @fileoverview MongoDB database connection configuration
 * 
 * This module handles connecting to MongoDB Atlas using Mongoose,
 * manages connection events, and provides graceful shutdown.
 * 
 * @module config/database
 */

const mongoose = require('mongoose');
const { config } = require('./index');

/**
 * MongoDB connection options
 * Note: Many options are now deprecated in Mongoose 8.x as they're enabled by default
 */
const mongooseOptions = {
  // Connection pool size
  maxPoolSize: 10,
  
  // Server selection timeout (ms)
  serverSelectionTimeoutMS: 5000,
  
  // Socket timeout (ms)
  socketTimeoutMS: 45000,
  
  // Buffering - if false, operations fail immediately when disconnected
  bufferCommands: true,
};

/**
 * Connects to MongoDB Atlas
 * @async
 * @returns {Promise<typeof mongoose>} Mongoose instance
 * @throws {Error} If connection fails after retries
 */
const connectDB = async () => {
  try {
    // Log connection attempt (hide credentials in URI)
    const sanitizedUri = config.mongodb.uri.replace(
      /:([^@]+)@/,
      ':****@'
    );
    console.log(`📦 Connecting to MongoDB: ${sanitizedUri}`);

    // Connect to MongoDB
    const conn = await mongoose.connect(config.mongodb.uri, mongooseOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    // Exit process with failure in production
    // In development, you might want to retry or continue without DB
    if (config.env === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
};

/**
 * Disconnects from MongoDB
 * @async
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB Disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    throw error;
  }
};

/**
 * Checks if database is connected
 * @returns {boolean} Connection status
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Gets the current connection state as a string
 * @returns {string} Connection state name
 */
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Gets database statistics
 * @async
 * @returns {Promise<Object>} Database stats
 */
const getDBStats = async () => {
  if (!isConnected()) {
    return { error: 'Not connected to database' };
  }
  
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      database: mongoose.connection.name,
      collections: stats.collections,
      documents: stats.objects,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
    };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================
// CONNECTION EVENT HANDLERS
// ============================================

/**
 * Handle successful connection
 */
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

/**
 * Handle connection error
 */
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

/**
 * Handle disconnection
 */
mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

/**
 * Handle reconnection
 */
mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
});

// ============================================
// GRACEFUL SHUTDOWN HANDLERS
// ============================================

/**
 * Graceful shutdown handler
 * @param {string} signal - The signal that triggered shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n📴 ${signal} received. Closing MongoDB connection...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // kill command

// Handle nodemon restarts
process.once('SIGUSR2', async () => {
  await mongoose.connection.close();
  process.kill(process.pid, 'SIGUSR2');
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  getConnectionState,
  getDBStats,
  mongoose, // Export mongoose instance for advanced usage
};