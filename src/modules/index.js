/**
 * @fileoverview Modules entrypoint
 *
 * Centralizes exports for feature modules:
 * - Express routes (mounted in app.js)
 * - Mongoose models (shared across modules)
 *
 * @module modules
 */

module.exports = {
  routes: require('./routes'),
  models: require('./models'),
};
