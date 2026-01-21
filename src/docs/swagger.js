/**
 * @fileoverview Swagger/OpenAPI Configuration
 *
 * Sets up Swagger documentation for the FoundingCircle API.
 *
 * @module docs/swagger
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { config } = require('../shared/config');

// ============================================
// SWAGGER OPTIONS
// ============================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FoundingCircle API',
      version: '1.0.0',
      description: `
## Overview

FoundingCircle is a platform connecting **Founders** with **Builders** (developers, designers, marketers) for startup collaborations.

### Key Features
- **OTP-based Authentication** - Passwordless login via email OTP
- **Dual Profiles** - Users can have both Founder and Builder profiles
- **Smart Matching** - Algorithm-based matching considering skills, compensation, commitment, and scenarios
- **Interest System** - Builders express interest in openings, Founders shortlist candidates
- **Conversations** - Real-time messaging between matched users
- **Trial Collaborations** - Structured trial periods before full commitment

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

### Rate Limiting
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 10 requests per hour
- OTP requests: 5 requests per 15 minutes

### WebSocket Events
Real-time features are available via Socket.io at \`ws://localhost:${config.port}\`
      `,
      contact: {
        name: 'FoundingCircle Support',
        email: 'support@foundingcircle.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
      {
        url: `https://api.foundingcircle.com/api/${config.apiVersion}`,
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints - OTP login, token refresh, logout',
      },
      {
        name: 'Users',
        description: 'User management - profile, status, admin operations',
      },
      {
        name: 'Profiles',
        description: 'Founder and Builder profile management',
      },
      {
        name: 'Uploads',
        description: 'File upload endpoints - photos, documents, attachments',
      },
      {
        name: 'Openings',
        description: 'Job/Role openings created by founders',
      },
      {
        name: 'Interests',
        description: 'Interest expression and shortlisting system',
      },
      {
        name: 'Matches',
        description: 'Matching algorithm and daily matches',
      },
      {
        name: 'Conversations',
        description: 'Messaging and conversation management',
      },
      {
        name: 'Trials',
        description: 'Trial collaboration management',
      },
      {
        name: 'Notifications',
        description: 'In-app notifications',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/docs/schemas/*.js',
    './src/docs/paths/*.js',
  ],
};

// Generate swagger spec
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ============================================
// SWAGGER SETUP FUNCTION
// ============================================

/**
 * Sets up Swagger documentation on the Express app
 * @param {Express} app - Express application instance
 */
const setupSwagger = (app) => {
  // Serve swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FoundingCircle API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
      },
    })
  );

  // Serve swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = {
  swaggerSpec,
  setupSwagger,
};
