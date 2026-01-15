/**
 * @fileoverview Application constants and enums
 * 
 * This file contains all the constant values used throughout the application.
 * Centralizing constants makes it easier to maintain consistency and update values.
 * 
 * @module constants
 */

// ============================================
// USER TYPES
// ============================================

/**
 * Types of users on the platform
 */
const USER_TYPES = Object.freeze({
    FOUNDER: 'FOUNDER',
    BUILDER: 'BUILDER',
    ADMIN: 'ADMIN',
  });
  
  // ============================================
  // STARTUP STAGES
  // ============================================
  
  /**
   * Stages of a startup's development
   */
  const STARTUP_STAGES = Object.freeze({
    IDEA: 'IDEA',
    MVP_PROGRESS: 'MVP_PROGRESS',
    MVP_LIVE: 'MVP_LIVE',
    EARLY_REVENUE: 'EARLY_REVENUE',
  });
  
  // ============================================
  // ROLE TYPES
  // ============================================
  
  /**
   * Types of roles founders are looking for
   */
  const ROLE_TYPES = Object.freeze({
    COFOUNDER: 'COFOUNDER',
    EMPLOYEE: 'EMPLOYEE',
    INTERN: 'INTERN',
    FRACTIONAL: 'FRACTIONAL',
  });
  
  // ============================================
  // RISK APPETITES
  // ============================================
  
  /**
   * Builder's risk tolerance levels
   */
  const RISK_APPETITES = Object.freeze({
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  });
  
  // ============================================
  // COMPENSATION TYPES
  // ============================================
  
  /**
   * Types of compensation builders are open to
   */
  const COMPENSATION_TYPES = Object.freeze({
    EQUITY_ONLY: 'EQUITY_ONLY',
    EQUITY_STIPEND: 'EQUITY_STIPEND',
    INTERNSHIP: 'INTERNSHIP',
    PAID_ONLY: 'PAID_ONLY',
  });
  
  // ============================================
  // VESTING TYPES
  // ============================================
  
  /**
   * Types of equity vesting schedules
   */
  const VESTING_TYPES = Object.freeze({
    STANDARD_4Y: 'STANDARD_4Y',
    STANDARD_3Y: 'STANDARD_3Y',
    CUSTOM: 'CUSTOM',
  });
  
  // ============================================
  // DURATION PREFERENCES
  // ============================================
  
  /**
   * Builder's duration preferences for roles
   */
  const DURATION_PREFERENCES = Object.freeze({
    SHORT_TERM: 'SHORT_TERM',
    LONG_TERM: 'LONG_TERM',
    FLEXIBLE: 'FLEXIBLE',
  });
  
  // ============================================
  // REMOTE PREFERENCES
  // ============================================
  
  /**
   * Remote work preferences
   */
  const REMOTE_PREFERENCES = Object.freeze({
    ONSITE: 'ONSITE',
    REMOTE: 'REMOTE',
    HYBRID: 'HYBRID',
  });
  
  // ============================================
  // CURRENCIES
  // ============================================
  
  /**
   * Supported currencies for compensation
   */
  const CURRENCIES = Object.freeze({
    INR: 'INR',
    AED: 'AED',
    USD: 'USD',
  });
  
  // ============================================
  // SCENARIO OPTIONS
  // ============================================
  
  /**
   * Options for scenario-based questions (A, B, C, D)
   */
  const SCENARIO_OPTIONS = Object.freeze({
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
  });
  
  // ============================================
  // OPENING STATUS
  // ============================================
  
  /**
   * Status of an opening/position
   */
  const OPENING_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    CLOSED: 'CLOSED',
    FILLED: 'FILLED',
  });
  
  // ============================================
  // INTEREST STATUS
  // ============================================
  
  /**
   * Status of a builder's interest in an opening
   */
  const INTEREST_STATUS = Object.freeze({
    INTERESTED: 'INTERESTED',
    SHORTLISTED: 'SHORTLISTED',
    MATCHED: 'MATCHED',
    PASSED: 'PASSED',
    WITHDRAWN: 'WITHDRAWN',
  });
  
  // ============================================
  // MATCH STATUS
  // ============================================
  
  /**
   * Status of a match between founder and builder
   */
  const MATCH_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    IN_TRIAL: 'IN_TRIAL',
    COMPLETED: 'COMPLETED',
    HIRED: 'HIRED',
    ENDED: 'ENDED',
  });
  
  // ============================================
  // TRIAL STATUS
  // ============================================
  
  /**
   * Status of a trial collaboration
   */
  const TRIAL_STATUS = Object.freeze({
    PROPOSED: 'PROPOSED',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  });
  
  // ============================================
// USER STATUS
// ============================================

/**
 * Account status for users
 */
const USER_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    BANNED: 'BANNED',
    DELETED: 'DELETED',
  });

  // ============================================
  // SUBSCRIPTION TIERS
  // ============================================
  
  /**
   * Subscription tiers for users
   */
  const SUBSCRIPTION_TIERS = Object.freeze({
    FREE: 'FREE',
    FOUNDER_PRO: 'FOUNDER_PRO',
    BUILDER_BOOST: 'BUILDER_BOOST',
  });
  
  // ============================================
  // MATCHING WEIGHTS
  // ============================================
  
  /**
   * Weights for the matching algorithm
   * Values should sum to 1.0 (100%)
   */
  const MATCHING_WEIGHTS = Object.freeze({
    COMPENSATION: 0.30,
    COMMITMENT: 0.20,
    STAGE: 0.15,
    SKILLS: 0.15,
    SCENARIO: 0.10,
    GEOGRAPHY: 0.10,
  });
  
  // ============================================
  // LIMITS
  // ============================================
  
  /**
   * Application limits and quotas
   */
  const LIMITS = Object.freeze({
    // Free tier limits
    FREE_DAILY_MATCHES: 5,
    FREE_SAVED_PROFILES: 10,
    FREE_ACTIVE_LISTINGS: 1,
    
    // Pro tier limits
    PRO_DAILY_MATCHES: -1, // unlimited
    PRO_SAVED_PROFILES: -1, // unlimited
    PRO_ACTIVE_LISTINGS: 5,
    
    // Builder boost limits
    BOOST_DAILY_MATCHES: 15,
    BOOST_SAVED_PROFILES: 50,
    
    // General limits
    MAX_SKILLS: 20,
    MAX_PORTFOLIO_LINKS: 10,
    MAX_CUSTOM_QUESTIONS: 5,
    MAX_INTENT_LENGTH: 300,
    MAX_BIO_LENGTH: 1000,
    
    // OTP limits
    OTP_EXPIRY_MINUTES: 10,
    OTP_MAX_ATTEMPTS: 3,
    OTP_COOLDOWN_MINUTES: 15,
    OTP_REQUESTS_PER_HOUR: 5,
  });
  
  // ============================================
  // PRICING (in smallest currency unit)
  // ============================================
  
  /**
   * Pricing configuration
   */
  const PRICING = Object.freeze({
    // Monthly subscription prices
    FOUNDER_PRO_INR: 149900, // ₹1,499
    BUILDER_BOOST_INR: 39900, // ₹399
    
    // Success fee
    SUCCESS_FEE_INR: 1000000, // ₹10,000
    
    // UAE pricing
    FOUNDER_PRO_AED: 7500, // AED 75
    BUILDER_BOOST_AED: 2000, // AED 20
  });
  
  // ============================================
  // ERROR CODES
  // ============================================
  
  /**
   * Application-specific error codes
   */
  const ERROR_CODES = Object.freeze({
    // Authentication errors (1000-1099)
    AUTH_INVALID_CREDENTIALS: 'AUTH_001',
    AUTH_TOKEN_EXPIRED: 'AUTH_002',
    AUTH_TOKEN_INVALID: 'AUTH_003',
    AUTH_EMAIL_NOT_VERIFIED: 'AUTH_004',
    AUTH_ACCOUNT_SUSPENDED: 'AUTH_005',
    AUTH_OTP_INVALID: 'AUTH_006',
    AUTH_OTP_EXPIRED: 'AUTH_007',
    AUTH_OTP_MAX_ATTEMPTS: 'AUTH_008',
    
    // User errors (1100-1199)
    USER_NOT_FOUND: 'USER_001',
    USER_ALREADY_EXISTS: 'USER_002',
    USER_PROFILE_INCOMPLETE: 'USER_003',
    USER_WRONG_TYPE: 'USER_004',
    
    // Profile errors (1200-1299)
    PROFILE_NOT_FOUND: 'PROFILE_001',
    PROFILE_ALREADY_EXISTS: 'PROFILE_002',
    PROFILE_INCOMPLETE: 'PROFILE_003',
    
    // Opening errors (1300-1399)
    OPENING_NOT_FOUND: 'OPENING_001',
    OPENING_CLOSED: 'OPENING_002',
    OPENING_LIMIT_REACHED: 'OPENING_003',
    
    // Interest errors (1400-1499)
    INTEREST_ALREADY_EXISTS: 'INTEREST_001',
    INTEREST_NOT_FOUND: 'INTEREST_002',
    INTEREST_INVALID_STATUS: 'INTEREST_003',
    
    // Match errors (1500-1599)
    MATCH_NOT_FOUND: 'MATCH_001',
    MATCH_ALREADY_EXISTS: 'MATCH_002',
    MATCH_INVALID_STATUS: 'MATCH_003',
    
    // Subscription errors (1600-1699)
    SUBSCRIPTION_REQUIRED: 'SUB_001',
    SUBSCRIPTION_EXPIRED: 'SUB_002',
    SUBSCRIPTION_LIMIT_REACHED: 'SUB_003',
    
    // Validation errors (1700-1799)
    VALIDATION_ERROR: 'VAL_001',
    INVALID_INPUT: 'VAL_002',
    
    // Server errors (1900-1999)
    INTERNAL_ERROR: 'SERVER_001',
    DATABASE_ERROR: 'SERVER_002',
    EXTERNAL_SERVICE_ERROR: 'SERVER_003',
  });
  
  // ============================================
  // EXPORTS
  // ============================================
  
  module.exports = {
    USER_TYPES,
    USER_STATUS,
    STARTUP_STAGES,
    ROLE_TYPES,
    RISK_APPETITES,
    COMPENSATION_TYPES,
    VESTING_TYPES,
    DURATION_PREFERENCES,
    REMOTE_PREFERENCES,
    CURRENCIES,
    SCENARIO_OPTIONS,
    OPENING_STATUS,
    INTEREST_STATUS,
    MATCH_STATUS,
    TRIAL_STATUS,
    SUBSCRIPTION_TIERS,
    MATCHING_WEIGHTS,
    LIMITS,
    PRICING,
    ERROR_CODES,
  };