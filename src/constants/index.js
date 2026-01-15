/**
 * @fileoverview Constants module aggregator
 * 
 * Re-exports all constants (enums and messages) for convenient importing.
 * 
 * @module constants
 * 
 * @example
 * // Import everything you need in one line
 * const { USER_TYPES, ROLE_TYPES, AUTH, formatMessage } = require('./constants');
 */

// Import all enums
const {
    // User enums
    USER_TYPES,
    USER_STATUS,
    SUBSCRIPTION_TIERS,
    
    // Founder profile enums
    STARTUP_STAGES,
    VESTING_TYPES,
    REMOTE_PREFERENCES,
    
    // Builder profile enums
    RISK_APPETITES,
    COMPENSATION_TYPES,
    DURATION_PREFERENCES,
    
    // Opening enums
    ROLE_TYPES,
    OPENING_STATUS,
    CURRENCIES,
    
    // Interest/Matching enums
    INTEREST_STATUS,
    MATCH_ACTIONS,
    
    // Conversation enums
    CONVERSATION_STATUS,
    MESSAGE_TYPES,
    
    // Trial enums
    TRIAL_STATUS,
    CHECKIN_FREQUENCY,
    TRIAL_OUTCOME,
    TRIAL_DURATIONS,
    
    // Upload enums
    UPLOAD_TYPES,
    UPLOAD_STATUS,
    
    // OTP enums
    OTP_PURPOSE,
    OTP_STATUS,
    
    // Scenario enums
    SCENARIO_OPTIONS,
    
    // Notification enums
    NOTIFICATION_TYPES,
    
    // Socket events
    SOCKET_EVENTS,
    
    // Skills
    SKILL_CATEGORIES,
    TECHNICAL_SKILLS,
    DESIGN_SKILLS,
    BUSINESS_SKILLS,
    ALL_SKILLS,
    
    // Ice breakers
    ICE_BREAKER_PROMPTS,
    
    // Enum helper functions
    isValidEnum,
    getEnumValues,
    getEnumKeys,
  } = require('./enums');
  
  // Import all messages
  const {
    GENERAL,
    AUTH,
    USER,
    ONBOARDING,
    OPENING,
    DISCOVERY,
    INTEREST,
    CONVERSATION,
    MESSAGE,
    TRIAL,
    UPLOAD,
    SCENARIO,
    ADMIN,
    NOTIFICATION,
    VALIDATION,
    formatMessage,
  } = require('./messages');
  
  // ============================================
  // NAMED EXPORTS
  // ============================================
  
  module.exports = {
    // ==========================================
    // ENUMS
    // ==========================================
    
    // User enums
    USER_TYPES,
    USER_STATUS,
    SUBSCRIPTION_TIERS,
    
    // Founder profile enums
    STARTUP_STAGES,
    VESTING_TYPES,
    REMOTE_PREFERENCES,
    
    // Builder profile enums
    RISK_APPETITES,
    COMPENSATION_TYPES,
    DURATION_PREFERENCES,
    
    // Opening enums
    ROLE_TYPES,
    OPENING_STATUS,
    CURRENCIES,
    
    // Interest/Matching enums
    INTEREST_STATUS,
    MATCH_ACTIONS,
    
    // Conversation enums
    CONVERSATION_STATUS,
    MESSAGE_TYPES,
    
    // Trial enums
    TRIAL_STATUS,
    CHECKIN_FREQUENCY,
    TRIAL_OUTCOME,
    TRIAL_DURATIONS,
    
    // Upload enums
    UPLOAD_TYPES,
    UPLOAD_STATUS,
    
    // OTP enums
    OTP_PURPOSE,
    OTP_STATUS,
    
    // Scenario enums
    SCENARIO_OPTIONS,
    
    // Notification enums
    NOTIFICATION_TYPES,
    
    // Socket events
    SOCKET_EVENTS,
    
    // Skills
    SKILL_CATEGORIES,
    TECHNICAL_SKILLS,
    DESIGN_SKILLS,
    BUSINESS_SKILLS,
    ALL_SKILLS,
    
    // Ice breakers
    ICE_BREAKER_PROMPTS,
    
    // Enum helper functions
    isValidEnum,
    getEnumValues,
    getEnumKeys,
    
    // ==========================================
    // MESSAGES
    // ==========================================
    
    // Message groups
    GENERAL,
    AUTH,
    USER,
    ONBOARDING,
    OPENING,
    DISCOVERY,
    INTEREST,
    CONVERSATION,
    MESSAGE,
    TRIAL,
    UPLOAD,
    SCENARIO,
    ADMIN,
    NOTIFICATION,
    VALIDATION,
    
    // Message helper
    formatMessage,
    
    // ==========================================
    // GROUPED EXPORTS (Alternative import style)
    // ==========================================
    
    /**
     * All enums grouped together
     * @example
     * const { ENUMS } = require('./constants');
     * console.log(ENUMS.USER_TYPES.FOUNDER);
     */
    ENUMS: {
      USER_TYPES,
      USER_STATUS,
      SUBSCRIPTION_TIERS,
      STARTUP_STAGES,
      VESTING_TYPES,
      REMOTE_PREFERENCES,
      RISK_APPETITES,
      COMPENSATION_TYPES,
      DURATION_PREFERENCES,
      ROLE_TYPES,
      OPENING_STATUS,
      CURRENCIES,
      INTEREST_STATUS,
      MATCH_ACTIONS,
      CONVERSATION_STATUS,
      MESSAGE_TYPES,
      TRIAL_STATUS,
      CHECKIN_FREQUENCY,
      TRIAL_OUTCOME,
      TRIAL_DURATIONS,
      UPLOAD_TYPES,
      UPLOAD_STATUS,
      OTP_PURPOSE,
      OTP_STATUS,
      SCENARIO_OPTIONS,
      NOTIFICATION_TYPES,
      SOCKET_EVENTS,
    },
    
    /**
     * All messages grouped together
     * @example
     * const { MESSAGES } = require('./constants');
     * console.log(MESSAGES.AUTH.LOGIN_SUCCESS);
     */
    MESSAGES: {
      GENERAL,
      AUTH,
      USER,
      ONBOARDING,
      OPENING,
      DISCOVERY,
      INTEREST,
      CONVERSATION,
      MESSAGE,
      TRIAL,
      UPLOAD,
      SCENARIO,
      ADMIN,
      NOTIFICATION,
      VALIDATION,
    },
    
    /**
     * All skills data grouped together
     * @example
     * const { SKILLS } = require('./constants');
     * console.log(SKILLS.ALL);
     */
    SKILLS: {
      CATEGORIES: SKILL_CATEGORIES,
      TECHNICAL: TECHNICAL_SKILLS,
      DESIGN: DESIGN_SKILLS,
      BUSINESS: BUSINESS_SKILLS,
      ALL: ALL_SKILLS,
    },
  };