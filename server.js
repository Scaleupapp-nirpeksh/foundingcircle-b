/**
 * @fileoverview Application entry point for FoundingCircle Backend
 * 
 * This file bootstraps the application:
 * 1. Handles uncaught exceptions
 * 2. Connects to MongoDB
 * 3. Starts the HTTP server
 * 4. Handles graceful shutdown
 * 
 * @module server
 */

'use strict';

// ============================================
// UNCAUGHT EXCEPTION HANDLER (Must be first!)
// ============================================
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
  
  // Exit immediately - the process is in an undefined state
  process.exit(1);
});

// ============================================
// IMPORTS
// ============================================
const http = require('http');
const { config } = require('./src/config');
const { connectDB, disconnectDB } = require('./src/config/database');

// We'll create app.js next - for now, create a placeholder
let app;
try {
  app = require('./src/app');
} catch (error) {
  // Temporary placeholder until we create app.js
  const express = require('express');
  app = express();
  app.get('/', (req, res) => {
    res.json({ 
      message: 'FoundingCircle API', 
      status: 'App.js not yet created',
      version: config.apiVersion 
    });
  });
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
}

// ============================================
// SERVER SETUP
// ============================================
const server = http.createServer(app);

// Server configuration
const PORT = config.port;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// ============================================
// START SERVER
// ============================================
/**
 * Starts the server after connecting to the database
 * @async
 */
const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB
    console.log('\n🚀 Starting FoundingCircle Backend...\n');
    await connectDB();
    
    // Step 2: Start HTTP server
    server.listen(PORT, HOST, () => {
      console.log('\n========================================');
      console.log('🎉 FoundingCircle Backend Started!');
      console.log('========================================');
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🌐 Server:      http://localhost:${PORT}`);
      console.log(`📚 API Docs:    http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health:      http://localhost:${PORT}/health`);
      console.log('========================================\n');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        throw error;
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ============================================
// UNHANDLED REJECTION HANDLER
// ============================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  
  // Close server gracefully, then exit
  server.close(() => {
    process.exit(1);
  });
  
  // Force exit if server doesn't close in 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing exit...');
    process.exit(1);
  }, 10000);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
/**
 * Handles graceful shutdown of the server
 * @param {string} signal - The signal that triggered shutdown
 */
const gracefulShutdown = (signal) => {
  console.log(`\n📴 ${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      // Close database connection
      await disconnectDB();
      console.log('✅ Database connection closed');
      
      console.log('👋 Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
      process.exit(1);
    }
  });
  
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('⚠️ Graceful shutdown timed out. Forcing exit...');
    process.exit(1);
  }, 30000); // 30 seconds timeout
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START THE APPLICATION
// ============================================
startServer();

// ============================================
// EXPORTS (for testing)
// ============================================
module.exports = { server, startServer };