/**
 * @fileoverview Application enumerations and constants
 * 
 * This file contains all enum values used throughout the application.
 * Using enums ensures consistency and prevents typos.
 * 
 * @module constants/enums
 */

// ============================================
// USER RELATED ENUMS
// ============================================

/**
 * User types in the system
 * @enum {string}
 */
const USER_TYPES = Object.freeze({
    FOUNDER: 'FOUNDER',
    BUILDER: 'BUILDER',
    ADMIN: 'ADMIN',
  });
  
  /**
   * User account status
   * @enum {string}
   */
  const USER_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    BANNED: 'BANNED',
    DELETED: 'DELETED',
  });
  
  /**
   * Subscription tiers
   * @enum {string}
   */
  const SUBSCRIPTION_TIERS = Object.freeze({
    FREE: 'FREE',
    FOUNDER_PRO: 'FOUNDER_PRO',
    BUILDER_BOOST: 'BUILDER_BOOST',
  });
  
  // ============================================
  // FOUNDER PROFILE ENUMS
  // ============================================
  
  /**
   * Startup stages
   * @enum {string}
   */
  const STARTUP_STAGES = Object.freeze({
    IDEA: 'IDEA',
    MVP_PROGRESS: 'MVP_PROGRESS',
    MVP_LIVE: 'MVP_LIVE',
    EARLY_REVENUE: 'EARLY_REVENUE',
  });
  
  /**
   * Vesting types for equity
   * @enum {string}
   */
  const VESTING_TYPES = Object.freeze({
    STANDARD_4Y: 'STANDARD_4Y',   // 4 years, 1 year cliff
    STANDARD_3Y: 'STANDARD_3Y',   // 3 years, 1 year cliff
    CUSTOM: 'CUSTOM',             // Custom vesting schedule
    NONE: 'NONE',                 // No vesting (immediate)
  });
  
  /**
   * Remote work preferences
   * @enum {string}
   */
  const REMOTE_PREFERENCES = Object.freeze({
    ONSITE: 'ONSITE',
    REMOTE: 'REMOTE',
    HYBRID: 'HYBRID',
  });
  
  // ============================================
  // BUILDER PROFILE ENUMS
  // ============================================
  
  /**
   * Risk appetite levels
   * @enum {string}
   */
  const RISK_APPETITES = Object.freeze({
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  });
  
  /**
   * Compensation openness options
   * @enum {string}
   */
  const COMPENSATION_TYPES = Object.freeze({
    EQUITY_ONLY: 'EQUITY_ONLY',
    EQUITY_STIPEND: 'EQUITY_STIPEND',
    INTERNSHIP: 'INTERNSHIP',
    PAID_ONLY: 'PAID_ONLY',
  });
  
  /**
   * Duration preferences
   * @enum {string}
   */
  const DURATION_PREFERENCES = Object.freeze({
    SHORT_TERM: 'SHORT_TERM',   // < 3 months
    LONG_TERM: 'LONG_TERM',     // 3+ months
    FLEXIBLE: 'FLEXIBLE',       // Either
  });
  
  // ============================================
  // OPENING ENUMS
  // ============================================
  
  /**
   * Role types for openings
   * @enum {string}
   */
  const ROLE_TYPES = Object.freeze({
    COFOUNDER: 'COFOUNDER',
    EMPLOYEE: 'EMPLOYEE',
    INTERN: 'INTERN',
    FRACTIONAL: 'FRACTIONAL',
  });
  
  /**
   * Opening status
   * @enum {string}
   */
  const OPENING_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    CLOSED: 'CLOSED',
    FILLED: 'FILLED',
  });
  
  /**
   * Currency types
   * @enum {string}
   */
  const CURRENCIES = Object.freeze({
    INR: 'INR',
    AED: 'AED',
    USD: 'USD',
  });
  
  // ============================================
  // INTEREST/MATCHING ENUMS
  // ============================================
  
  /**
   * Interest status (builder's interest in an opening)
   * @enum {string}
   */
  const INTEREST_STATUS = Object.freeze({
    INTERESTED: 'INTERESTED',     // Builder expressed interest
    SHORTLISTED: 'SHORTLISTED',   // Founder shortlisted
    PASSED: 'PASSED',             // Founder passed
    WITHDRAWN: 'WITHDRAWN',       // Builder withdrew
  });
  
  /**
   * Match action types
   * @enum {string}
   */
  const MATCH_ACTIONS = Object.freeze({
    LIKE: 'LIKE',
    SKIP: 'SKIP',
    SAVE: 'SAVE',
  });
  
  // ============================================
  // CONVERSATION ENUMS
  // ============================================
  
  /**
   * Conversation status
   * @enum {string}
   */
  const CONVERSATION_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    ARCHIVED: 'ARCHIVED',
    BLOCKED: 'BLOCKED',
  });
  
  /**
   * Message types
   * @enum {string}
   */
  const MESSAGE_TYPES = Object.freeze({
    TEXT: 'TEXT',
    SYSTEM: 'SYSTEM',
    TRIAL_PROPOSAL: 'TRIAL_PROPOSAL',
    TRIAL_UPDATE: 'TRIAL_UPDATE',
    ATTACHMENT: 'ATTACHMENT',
    ICE_BREAKER: 'ICE_BREAKER',
  });
  
  // ============================================
  // TRIAL ENUMS
  // ============================================
  
  /**
   * Trial status
   * @enum {string}
   */
  const TRIAL_STATUS = Object.freeze({
    PROPOSED: 'PROPOSED',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DECLINED: 'DECLINED',
  });
  
  /**
   * Trial check-in frequency
   * @enum {string}
   */
  const CHECKIN_FREQUENCY = Object.freeze({
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    NONE: 'NONE',
  });
  
  /**
   * Trial outcome
   * @enum {string}
   */
  const TRIAL_OUTCOME = Object.freeze({
    CONTINUE: 'CONTINUE',
    END: 'END',
    PENDING: 'PENDING',
  });
  
  /**
   * Trial duration options (in days)
   * @enum {number}
   */
  const TRIAL_DURATIONS = Object.freeze({
    ONE_WEEK: 7,
    TWO_WEEKS: 14,
    THREE_WEEKS: 21,
  });
  
  // ============================================
  // UPLOAD ENUMS
  // ============================================
  
  /**
   * Upload types
   * @enum {string}
   */
  const UPLOAD_TYPES = Object.freeze({
    PROFILE_PHOTO: 'PROFILE_PHOTO',
    ATTACHMENT: 'ATTACHMENT',
    PORTFOLIO: 'PORTFOLIO',
  });
  
  /**
   * Upload status
   * @enum {string}
   */
  const UPLOAD_STATUS = Object.freeze({
    PENDING: 'PENDING',     // Upload URL generated, waiting for upload
    COMPLETED: 'COMPLETED', // File uploaded successfully
    FAILED: 'FAILED',       // Upload failed
    DELETED: 'DELETED',     // File deleted
  });
  
  // ============================================
  // OTP ENUMS
  // ============================================
  
  /**
   * OTP purpose
   * @enum {string}
   */
  const OTP_PURPOSE = Object.freeze({
    REGISTRATION: 'REGISTRATION',
    LOGIN: 'LOGIN',
    PASSWORD_RESET: 'PASSWORD_RESET',
    PHONE_VERIFICATION: 'PHONE_VERIFICATION',
  });
  
  /**
   * OTP status
   * @enum {string}
   */
  const OTP_STATUS = Object.freeze({
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    EXPIRED: 'EXPIRED',
    MAX_ATTEMPTS: 'MAX_ATTEMPTS',
  });
  
  // ============================================
  // SCENARIO ENUMS
  // ============================================
  
  /**
   * Scenario answer options
   * @enum {string}
   */
  const SCENARIO_OPTIONS = Object.freeze({
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
  });
  
  // ============================================
  // NOTIFICATION ENUMS
  // ============================================
  
  /**
   * Notification types
   * @enum {string}
   */
  const NOTIFICATION_TYPES = Object.freeze({
    NEW_MATCH: 'NEW_MATCH',
    NEW_INTEREST: 'NEW_INTEREST',
    SHORTLISTED: 'SHORTLISTED',
    NEW_MESSAGE: 'NEW_MESSAGE',
    TRIAL_PROPOSED: 'TRIAL_PROPOSED',
    TRIAL_ACCEPTED: 'TRIAL_ACCEPTED',
    TRIAL_COMPLETED: 'TRIAL_COMPLETED',
    TRIAL_REMINDER: 'TRIAL_REMINDER',
    PROFILE_VIEW: 'PROFILE_VIEW',
    SYSTEM: 'SYSTEM',
  });
  
  // ============================================
  // SOCKET EVENTS
  // ============================================
  
  /**
   * Socket.io event names
   * @enum {string}
   */
  const SOCKET_EVENTS = Object.freeze({
    // Connection
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',

    // Chat
    JOIN_CONVERSATION: 'join_conversation',
    LEAVE_CONVERSATION: 'leave_conversation',
    SEND_MESSAGE: 'send_message',
    NEW_MESSAGE: 'new_message',
    MESSAGE_SENT: 'message_sent',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    USER_TYPING: 'user_typing',
    USER_STOPPED_TYPING: 'user_stopped_typing',
    MARK_READ: 'mark_read',
    MESSAGES_READ: 'messages_read',

    // Notifications
    NEW_NOTIFICATION: 'new_notification',
    UNREAD_COUNT_UPDATED: 'unread_count_updated',

    // Interests & Matches
    NEW_MATCH: 'new_match',
    NEW_INTEREST: 'new_interest',
    BUILDER_SHORTLISTED: 'builder_shortlisted',

    // Trials
    TRIAL_UPDATE: 'trial_update',
    TRIAL_PROPOSED: 'trial_proposed',
    TRIAL_ACCEPTED: 'trial_accepted',

    // Errors
    ERROR: 'error',
  });
  
  // ============================================
  // SKILL CATEGORIES
  // ============================================
  
  /**
   * Skill categories for filtering
   * @enum {string}
   */
  const SKILL_CATEGORIES = Object.freeze({
    TECHNICAL: 'TECHNICAL',
    DESIGN: 'DESIGN',
    BUSINESS: 'BUSINESS',
    DOMAIN: 'DOMAIN',
  });
  
  /**
   * Predefined technical skills
   */
  const TECHNICAL_SKILLS = Object.freeze([
    'Frontend Development',
    'Backend Development',
    'Full-Stack Development',
    'Mobile Development (iOS)',
    'Mobile Development (Android)',
    'React',
    'React Native',
    'Flutter',
    'Node.js',
    'Python',
    'Java',
    'Go',
    'Rust',
    'TypeScript',
    'JavaScript',
    'DevOps',
    'Cloud Infrastructure (AWS)',
    'Cloud Infrastructure (GCP)',
    'Cloud Infrastructure (Azure)',
    'Data Engineering',
    'Machine Learning',
    'Data Science',
    'Blockchain',
    'Security',
    'QA/Testing',
    'Database Management',
    'API Development',
    'System Design',
  ]);
  
  /**
   * Predefined design skills
   */
  const DESIGN_SKILLS = Object.freeze([
    'UI Design',
    'UX Design',
    'Product Design',
    'Brand Design',
    'Graphic Design',
    'Motion Design',
    'Illustration',
    'Design Systems',
    'User Research',
    'Figma',
    'Sketch',
    'Adobe XD',
    'Prototyping',
    'Wireframing',
  ]);
  
  /**
   * Predefined business skills
   */
  const BUSINESS_SKILLS = Object.freeze([
    'Product Management',
    'Project Management',
    'Business Development',
    'Sales',
    'Marketing',
    'Growth',
    'Content Marketing',
    'SEO',
    'Social Media',
    'Community Building',
    'Operations',
    'Finance',
    'Legal',
    'HR',
    'Fundraising',
    'Strategy',
    'Analytics',
  ]);
  
  /**
   * All skills combined
   */
  const ALL_SKILLS = Object.freeze([
    ...TECHNICAL_SKILLS,
    ...DESIGN_SKILLS,
    ...BUSINESS_SKILLS,
  ]);
  
  // ============================================
  // ICE BREAKER PROMPTS
  // ============================================
  
  /**
   * Ice breaker prompts for chat initiation
   */
  const ICE_BREAKER_PROMPTS = Object.freeze([
    "What excited you most about the other person's profile?",
    "What's one question you'd want answered before working together?",
    "If you could work on any problem, what would it be and why?",
    "What's your ideal working relationship look like?",
    "What accomplishment are you most proud of?",
    "What's one thing you're hoping to learn from this collaboration?",
    "How do you prefer to communicate when working remotely?",
    "What does a successful first month working together look like to you?",
  ]);
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  /**
   * Checks if a value is valid for an enum
   * @param {Object} enumObj - The enum object
   * @param {string} value - The value to check
   * @returns {boolean} True if valid
   * 
   * @example
   * isValidEnum(USER_TYPES, 'FOUNDER') // true
   * isValidEnum(USER_TYPES, 'INVALID') // false
   */
  const isValidEnum = (enumObj, value) => {
    return Object.values(enumObj).includes(value);
  };
  
  /**
   * Gets all values of an enum as array
   * @param {Object} enumObj - The enum object
   * @returns {string[]} Array of enum values
   * 
   * @example
   * getEnumValues(USER_TYPES) // ['FOUNDER', 'BUILDER', 'ADMIN']
   */
  const getEnumValues = (enumObj) => {
    return Object.values(enumObj);
  };
  
  /**
   * Gets all keys of an enum as array
   * @param {Object} enumObj - The enum object
   * @returns {string[]} Array of enum keys
   */
  const getEnumKeys = (enumObj) => {
    return Object.keys(enumObj);
  };
  
  // ============================================
  // EXPORTS
  // ============================================
  
  module.exports = {
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
    
    // Helper functions
    isValidEnum,
    getEnumValues,
    getEnumKeys,
  };