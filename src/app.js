/**
 * @fileoverview Express Application Configuration
 *
 * Sets up Express app with middleware, routes, and error handling.
 *
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const { config } = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { ApiResponse } = require('./utils');
const { setupSwagger } = require('./docs');

// ============================================
// CREATE EXPRESS APP
// ============================================

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Sanitize request data against NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// COMPRESSION & LOGGING
// ============================================

// Compress responses
app.use(compression());

// HTTP request logging (skip in test environment)
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FoundingCircle API is healthy',
    data: {
      status: 'OK',
      environment: config.env,
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================
// SWAGGER DOCUMENTATION
// ============================================

// Setup Swagger UI at /api-docs
setupSwagger(app);

// ============================================
// API ROUTES
// ============================================

// Mount API routes
app.use(`/api/${config.apiVersion}`, routes);

// Root endpoint
app.get('/', (req, res) => {
  ApiResponse.ok('Welcome to FoundingCircle API', {
    version: config.apiVersion,
    documentation: `/api-docs`,
  }).send(res);
});

// ============================================
// ERROR HANDLING
// ============================================

// Handle 404 - Not Found
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// EXPORTS
// ============================================

module.exports = app;
