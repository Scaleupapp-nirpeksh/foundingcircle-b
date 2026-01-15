/**
 * @fileoverview Documentation Module Index
 *
 * Exports Swagger documentation setup.
 *
 * @module docs
 */

const { swaggerSpec, setupSwagger } = require('./swagger');

// Import schemas and paths to ensure they are registered
require('./schemas');
require('./paths');

module.exports = {
  swaggerSpec,
  setupSwagger,
};
