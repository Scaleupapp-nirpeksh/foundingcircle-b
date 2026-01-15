/**
 * @fileoverview Model index - Central export for all Mongoose models
 * 
 * This barrel file exports all models from a single location,
 * making imports cleaner throughout the application.
 * 
 * Usage:
 *   const { User, FounderProfile, Match } = require('./models');
 * 
 * @module models
 */

// ============================================
// CORE USER MODELS
// ============================================

/**
 * User model - Base authentication and user data
 * Handles: email/password auth, user type, verification
 */
const User = require('./User');

/**
 * FounderProfile model - Detailed founder/startup information
 * Handles: startup details, compensation offers, intent
 */
const FounderProfile = require('./FounderProfile');

/**
 * BuilderProfile model - Detailed builder/talent information
 * Handles: skills, risk appetite, availability, intent
 */
const BuilderProfile = require('./BuilderProfile');

// ============================================
// ASSESSMENT MODELS
// ============================================

/**
 * ScenarioResponse model - Working style compatibility quiz
 * Handles: 6 scenario responses, compatibility scoring
 */
const ScenarioResponse = require('./ScenarioResponse');

// ============================================
// MATCHING MODELS
// ============================================

/**
 * Opening model - Job/role positions created by founders
 * Handles: role details, requirements, compensation, status
 */
const Opening = require('./Opening');

/**
 * Interest model - Builder interest in openings
 * Handles: interest lifecycle, custom answers, status tracking
 */
const Interest = require('./Interest');

/**
 * Match model - Mutual matches between founders and builders
 * Handles: match lifecycle, trials, feedback, outcomes
 */
const Match = require('./Match');

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Core user models
  User,
  FounderProfile,
  BuilderProfile,
  
  // Assessment models
  ScenarioResponse,
  
  // Matching models
  Opening,
  Interest,
  Match,
};

// ============================================
// MODEL DOCUMENTATION
// ============================================

/**
 * @typedef {Object} ModelOverview
 * 
 * CORE USER MODELS:
 * -----------------
 * User              - Base user authentication (email, password, type)
 *                     One per person, links to either FounderProfile or BuilderProfile
 * 
 * FounderProfile    - Extended founder data (startup info, compensation offers)
 *                     One per founder user, required for creating openings
 * 
 * BuilderProfile    - Extended builder data (skills, risk appetite, availability)
 *                     One per builder user, required for expressing interest
 * 
 * ASSESSMENT MODELS:
 * ------------------
 * ScenarioResponse  - Working style quiz answers (6 scenarios)
 *                     One per user (optional but encouraged), used for compatibility
 * 
 * MATCHING MODELS:
 * ----------------
 * Opening           - Role/position a founder is hiring for
 *                     Many per founder, builders express interest in these
 * 
 * Interest          - Builder's interest in an opening
 *                     One per builder-opening pair, tracks interest lifecycle
 * 
 * Match             - Mutual match (founder accepted builder's interest)
 *                     One per builder-opening pair, tracks match lifecycle
 * 
 * RELATIONSHIPS:
 * --------------
 * User (1) -----> (1) FounderProfile (for founders)
 * User (1) -----> (1) BuilderProfile (for builders)
 * User (1) -----> (1) ScenarioResponse (optional)
 * 
 * FounderProfile (1) -----> (many) Opening
 * 
 * Opening (1) <-----> (many) Interest
 * Builder (1) -----> (many) Interest
 * 
 * Interest (1) -----> (0-1) Match
 * Opening (1) <-----> (many) Match
 * Builder (1) -----> (many) Match
 * Founder (1) -----> (many) Match
 * 
 * LIFECYCLE FLOW:
 * ---------------
 * 1. User signs up → User created
 * 2. User completes onboarding → FounderProfile or BuilderProfile created
 * 3. User takes quiz (optional) → ScenarioResponse created
 * 4. Founder creates opening → Opening created
 * 5. Builder expresses interest → Interest created (status: INTERESTED)
 * 6. Founder shortlists → Interest updated (status: SHORTLISTED)
 * 7. Founder accepts → Match created, Interest updated (status: MATCHED)
 * 8. Trial or hire → Match updated (status: IN_TRIAL, HIRED, etc.)
 */