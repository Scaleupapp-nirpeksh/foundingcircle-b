/**
 * @fileoverview Centralized response messages
 * 
 * All user-facing messages used in API responses.
 * Organized by domain/feature for easy navigation.
 * 
 * @module constants/messages
 */

// ============================================
// GENERAL MESSAGES
// ============================================

const GENERAL = Object.freeze({
    // Success
    SUCCESS: 'Operation completed successfully',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    FETCHED: 'Data retrieved successfully',
    
    // Errors
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
    BAD_REQUEST: 'Invalid request. Please check your input.',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    FORBIDDEN: 'Access denied',
    VALIDATION_ERROR: 'Validation failed. Please check your input.',
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
    
    // Misc
    INVALID_ID: 'Invalid ID format',
    MISSING_REQUIRED_FIELDS: 'Please provide all required fields',
  });
  
  // ============================================
  // AUTHENTICATION MESSAGES
  // ============================================
  
  const AUTH = Object.freeze({
    // Success
    REGISTER_SUCCESS: 'Registration successful. Welcome to FoundingCircle!',
    LOGIN_SUCCESS: 'Login successful. Welcome back!',
    LOGOUT_SUCCESS: 'Logged out successfully',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    TOKEN_REFRESHED: 'Token refreshed successfully',
    EMAIL_VERIFIED: 'Email verified successfully',
    PHONE_VERIFIED: 'Phone number verified successfully',
    
    // OTP
    OTP_SENT: 'OTP sent successfully',
    OTP_SENT_EMAIL: 'OTP sent to your email',
    OTP_SENT_PHONE: 'OTP sent to your phone',
    OTP_VERIFIED: 'OTP verified successfully',
    OTP_RESENT: 'OTP resent successfully',
    
    // Errors
    INVALID_CREDENTIALS: 'Invalid email or password',
    INVALID_EMAIL: 'Please provide a valid email address',
    INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    INVALID_PHONE: 'Please provide a valid phone number',
    INVALID_OTP: 'Invalid OTP. Please try again.',
    OTP_EXPIRED: 'OTP has expired. Please request a new one.',
    OTP_MAX_ATTEMPTS: 'Maximum OTP attempts exceeded. Please request a new OTP.',
    OTP_COOLDOWN: 'Please wait before requesting another OTP',
    INVALID_TOKEN: 'Invalid or expired token',
    TOKEN_EXPIRED: 'Your session has expired. Please login again.',
    TOKEN_REQUIRED: 'Authentication required. Please login.',
    REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
    REFRESH_TOKEN_INVALID: 'Invalid refresh token. Please login again.',
    
    // Account
    USER_EXISTS_EMAIL: 'An account with this email already exists',
    USER_EXISTS_PHONE: 'An account with this phone number already exists',
    USER_NOT_FOUND: 'No account found with these credentials',
    ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
    ACCOUNT_BANNED: 'Your account has been banned',
    ACCOUNT_INACTIVE: 'Your account is inactive. Please verify your email.',
    ACCOUNT_DELETED: 'This account has been deleted',
    
    // Password
    PASSWORD_MISMATCH: 'Passwords do not match',
    PASSWORD_SAME_AS_OLD: 'New password must be different from current password',
    INCORRECT_PASSWORD: 'Current password is incorrect',
    PASSWORD_RESET_REQUESTED: 'Password reset instructions sent to your email',
  });
  
  // ============================================
  // USER MESSAGES
  // ============================================
  
  const USER = Object.freeze({
    // Success
    PROFILE_FETCHED: 'Profile retrieved successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    SETTINGS_UPDATED: 'Settings updated successfully',
    PHOTO_UPLOADED: 'Profile photo uploaded successfully',
    PHOTO_REMOVED: 'Profile photo removed successfully',
    
    // Errors
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
    INVALID_USER_TYPE: 'Invalid user type',
    PROFILE_INCOMPLETE: 'Please complete your profile first',
    
    // Subscription
    SUBSCRIPTION_UPGRADED: 'Subscription upgraded successfully',
    SUBSCRIPTION_CANCELLED: 'Subscription cancelled',
    SUBSCRIPTION_REQUIRED: 'This feature requires a subscription upgrade',
    ALREADY_SUBSCRIBED: 'You already have an active subscription',
  });
  
  // ============================================
  // ONBOARDING MESSAGES
  // ============================================
  
  const ONBOARDING = Object.freeze({
    // Success
    FOUNDER_PROFILE_CREATED: 'Founder profile created successfully',
    BUILDER_PROFILE_CREATED: 'Builder profile created successfully',
    PROFILE_COMPLETED: 'Profile completed successfully. Start exploring!',
    SCENARIO_COMPLETED: 'Working style assessment completed',
    
    // Errors
    ALREADY_ONBOARDED: 'You have already completed onboarding',
    INCOMPLETE_FOUNDER_PROFILE: 'Please complete all founder profile fields',
    INCOMPLETE_BUILDER_PROFILE: 'Please complete all builder profile fields',
    INVALID_STARTUP_STAGE: 'Invalid startup stage',
    INVALID_ROLE_TYPE: 'Invalid role type',
    INVALID_RISK_APPETITE: 'Invalid risk appetite level',
    INVALID_COMPENSATION_TYPE: 'Invalid compensation type',
    EQUITY_RANGE_INVALID: 'Minimum equity cannot be greater than maximum',
    CASH_RANGE_INVALID: 'Minimum cash cannot be greater than maximum',
    SKILLS_REQUIRED: 'Please add at least 2 skills',
    INTENT_REQUIRED: 'Intent statement is required',
    INTENT_TOO_LONG: 'Intent statement must be 300 characters or less',
    RISK_DISCLOSURE_REQUIRED: 'Please acknowledge all risk disclosures',
  });
  
  // ============================================
  // OPENING MESSAGES
  // ============================================
  
  const OPENING = Object.freeze({
    // Success
    CREATED: 'Opening created successfully',
    UPDATED: 'Opening updated successfully',
    DELETED: 'Opening deleted successfully',
    CLOSED: 'Opening closed successfully',
    PAUSED: 'Opening paused successfully',
    ACTIVATED: 'Opening activated successfully',
    FETCHED: 'Opening retrieved successfully',
    LIST_FETCHED: 'Openings retrieved successfully',
    
    // Errors
    NOT_FOUND: 'Opening not found',
    NOT_ACTIVE: 'This opening is no longer active',
    NOT_OWNER: 'You are not authorized to modify this opening',
    LIMIT_REACHED: 'You have reached your maximum opening limit. Upgrade to create more.',
    ALREADY_EXISTS: 'You already have a similar opening',
    INVALID_STATUS: 'Invalid opening status',
    CANNOT_DELETE_WITH_INTERESTS: 'Cannot delete opening with active interests',
    
    // Validation
    TITLE_REQUIRED: 'Opening title is required',
    ROLE_TYPE_REQUIRED: 'Role type is required',
    DESCRIPTION_REQUIRED: 'Opening description is required',
  });
  
  // ============================================
  // DISCOVERY/MATCHING MESSAGES
  // ============================================
  
  const DISCOVERY = Object.freeze({
    // Success
    FEED_FETCHED: 'Discovery feed loaded successfully',
    MATCHES_FETCHED: 'Matches retrieved successfully',
    MATCH_FOUND: 'Match found!',
    
    // Errors
    NO_MATCHES: 'No matches found. Try adjusting your preferences.',
    DAILY_LIMIT_REACHED: 'You have reached your daily match limit. Come back tomorrow or upgrade to Pro!',
    ALREADY_ACTIONED: 'You have already actioned this profile',
    CANNOT_MATCH_SELF: 'You cannot match with yourself',
    PROFILE_UNAVAILABLE: 'This profile is no longer available',
  });
  
  // ============================================
  // INTEREST MESSAGES
  // ============================================
  
  const INTEREST = Object.freeze({
    // Success
    EXPRESSED: 'Interest expressed successfully',
    WITHDRAWN: 'Interest withdrawn successfully',
    SHORTLISTED: 'Builder shortlisted successfully',
    PASSED: 'Marked as passed',
    LIST_FETCHED: 'Interests retrieved successfully',
    
    // Mutual Interest
    MUTUAL_INTEREST: "It's a match! You can now start a conversation.",
    CONVERSATION_STARTED: 'Conversation started. Say hello!',
    
    // Errors
    NOT_FOUND: 'Interest not found',
    ALREADY_INTERESTED: 'You have already expressed interest in this opening',
    ALREADY_SHORTLISTED: 'This builder is already shortlisted',
    ALREADY_PASSED: 'You have already passed on this builder',
    CANNOT_INTEREST_OWN: 'You cannot express interest in your own opening',
    OPENING_CLOSED: 'This opening is no longer accepting interests',
    NOT_AUTHORIZED: 'You are not authorized to perform this action',
  });
  
  // ============================================
  // CONVERSATION MESSAGES
  // ============================================
  
  const CONVERSATION = Object.freeze({
    // Success
    CREATED: 'Conversation started',
    FETCHED: 'Conversation retrieved successfully',
    LIST_FETCHED: 'Conversations retrieved successfully',
    ARCHIVED: 'Conversation archived',
    UNARCHIVED: 'Conversation restored',
    MARKED_READ: 'Messages marked as read',
    
    // Errors
    NOT_FOUND: 'Conversation not found',
    NOT_PARTICIPANT: 'You are not a participant in this conversation',
    ALREADY_EXISTS: 'Conversation already exists',
    CANNOT_MESSAGE_SELF: 'You cannot message yourself',
    BLOCKED: 'This conversation has been blocked',
    ARCHIVED_NO_MESSAGE: 'Cannot send messages to archived conversation',
  });
  
  // ============================================
  // MESSAGE MESSAGES
  // ============================================
  
  const MESSAGE = Object.freeze({
    // Success
    SENT: 'Message sent',
    DELETED: 'Message deleted',
    FETCHED: 'Messages retrieved successfully',
    
    // Errors
    NOT_FOUND: 'Message not found',
    EMPTY_MESSAGE: 'Message cannot be empty',
    TOO_LONG: 'Message is too long',
    SEND_FAILED: 'Failed to send message. Please try again.',
    NOT_SENDER: 'You can only delete your own messages',
  });
  
  // ============================================
  // TRIAL MESSAGES
  // ============================================
  
  const TRIAL = Object.freeze({
    // Success
    PROPOSED: 'Trial proposed successfully',
    ACCEPTED: 'Trial accepted. Good luck!',
    DECLINED: 'Trial declined',
    STARTED: 'Trial has started',
    COMPLETED: 'Trial completed',
    CANCELLED: 'Trial cancelled',
    FEEDBACK_SUBMITTED: 'Feedback submitted successfully',
    FETCHED: 'Trial details retrieved successfully',
    
    // In Progress
    REMINDER: 'Trial reminder: Day {day} of {total}',
    CHECKIN_REMINDER: 'Time for your scheduled check-in!',
    ENDING_SOON: 'Your trial ends in {days} days',
    
    // Outcomes
    BOTH_CONTINUE: 'Great news! Both parties want to continue. Time to formalize the relationship!',
    MUTUAL_END: 'The trial has ended. Thank you for trying.',
    
    // Errors
    NOT_FOUND: 'Trial not found',
    NOT_PARTICIPANT: 'You are not a participant in this trial',
    ALREADY_ACTIVE: 'There is already an active trial for this match',
    ALREADY_RESPONDED: 'You have already responded to this trial proposal',
    NOT_PROPOSED_STATE: 'Trial is not in proposed state',
    NOT_ACTIVE_STATE: 'Trial is not currently active',
    CANNOT_PROPOSE_SELF: 'You cannot propose a trial to yourself',
    FEEDBACK_ALREADY_SUBMITTED: 'You have already submitted feedback for this trial',
    TRIAL_NOT_COMPLETED: 'Trial must be completed before submitting feedback',
    INVALID_DURATION: 'Invalid trial duration',
    INVALID_GOAL: 'Please provide a clear goal for the trial',
  });
  
  // ============================================
  // UPLOAD MESSAGES
  // ============================================
  
  const UPLOAD = Object.freeze({
    // Success
    UPLOADED: 'File uploaded successfully',
    DELETED: 'File deleted successfully',
    URL_GENERATED: 'Upload URL generated',
    
    // Errors
    FAILED: 'File upload failed. Please try again.',
    TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_TYPE: 'Invalid file type. Allowed types: {types}',
    NOT_FOUND: 'File not found',
    UPLOAD_EXPIRED: 'Upload URL has expired. Please request a new one.',
  });
  
  // ============================================
  // SCENARIO/COMPATIBILITY MESSAGES
  // ============================================
  
  const SCENARIO = Object.freeze({
    // Success
    SAVED: 'Working style preferences saved',
    COMPLETED: 'Assessment completed successfully',
    
    // Errors
    ALREADY_COMPLETED: 'You have already completed the assessment this month',
    INVALID_RESPONSE: 'Invalid response option',
    INCOMPLETE: 'Please answer all scenarios',
    COOLDOWN_ACTIVE: 'You can retake the assessment in {days} days',
  });
  
  // ============================================
  // ADMIN MESSAGES
  // ============================================
  
  const ADMIN = Object.freeze({
    // Success
    USER_SUSPENDED: 'User suspended successfully',
    USER_UNSUSPENDED: 'User unsuspended successfully',
    USER_BANNED: 'User banned successfully',
    USER_VERIFIED: 'User verified successfully',
    PROFILE_APPROVED: 'Profile approved successfully',
    PROFILE_REJECTED: 'Profile rejected',
    CONTENT_REMOVED: 'Content removed successfully',
    STATS_FETCHED: 'Statistics retrieved successfully',
    
    // Errors
    ADMIN_REQUIRED: 'Admin access required',
    CANNOT_MODIFY_ADMIN: 'Cannot modify another admin',
    USER_ALREADY_SUSPENDED: 'User is already suspended',
    USER_NOT_SUSPENDED: 'User is not suspended',
  });
  
  // ============================================
  // NOTIFICATION MESSAGES
  // ============================================
  
  const NOTIFICATION = Object.freeze({
    // Titles
    NEW_MATCH_TITLE: 'New Match!',
    NEW_INTEREST_TITLE: 'New Interest',
    SHORTLISTED_TITLE: 'You were shortlisted!',
    NEW_MESSAGE_TITLE: 'New Message',
    TRIAL_PROPOSED_TITLE: 'Trial Proposal',
    TRIAL_ACCEPTED_TITLE: 'Trial Accepted',
    TRIAL_COMPLETED_TITLE: 'Trial Completed',
    
    // Bodies
    NEW_MATCH_BODY: '{name} is interested in connecting with you!',
    NEW_INTEREST_BODY: '{name} expressed interest in your opening: {opening}',
    SHORTLISTED_BODY: 'Great news! {name} shortlisted you for {opening}',
    NEW_MESSAGE_BODY: '{name}: {preview}',
    TRIAL_PROPOSED_BODY: '{name} proposed a {duration}-day trial',
    TRIAL_ACCEPTED_BODY: '{name} accepted your trial proposal',
    TRIAL_COMPLETED_BODY: 'Your trial with {name} has ended. Share your feedback!',
  });
  
  // ============================================
  // VALIDATION MESSAGES
  // ============================================
  
  const VALIDATION = Object.freeze({
    // Required fields
    REQUIRED: '{field} is required',
    REQUIRED_FIELD: 'This field is required',
    
    // String validations
    MIN_LENGTH: '{field} must be at least {min} characters',
    MAX_LENGTH: '{field} must be at most {max} characters',
    EXACT_LENGTH: '{field} must be exactly {length} characters',
    
    // Number validations
    MIN_VALUE: '{field} must be at least {min}',
    MAX_VALUE: '{field} must be at most {max}',
    POSITIVE_NUMBER: '{field} must be a positive number',
    INTEGER_REQUIRED: '{field} must be a whole number',
    
    // Format validations
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_URL: 'Please enter a valid URL',
    INVALID_DATE: 'Please enter a valid date',
    INVALID_FORMAT: 'Invalid format for {field}',
    
    // Array validations
    MIN_ITEMS: 'Please select at least {min} {field}',
    MAX_ITEMS: 'Please select at most {max} {field}',
    INVALID_OPTION: 'Invalid option selected for {field}',
    
    // Enum validations
    INVALID_ENUM: '{field} must be one of: {values}',
  });
  
  // ============================================
  // HELPER FUNCTION
  // ============================================
  
  /**
   * Replaces placeholders in a message string
   * @param {string} message - Message with placeholders like {name}
   * @param {Object} params - Key-value pairs to replace
   * @returns {string} Message with replaced values
   * 
   * @example
   * formatMessage('{name} joined', { name: 'John' }) // 'John joined'
   * formatMessage('Day {day} of {total}', { day: 2, total: 7 }) // 'Day 2 of 7'
   */
  const formatMessage = (message, params = {}) => {
    return Object.entries(params).reduce((msg, [key, value]) => {
      return msg.replace(new RegExp(`{${key}}`, 'g'), value);
    }, message);
  };
  
  // ============================================
  // EXPORTS
  // ============================================
  
  module.exports = {
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
  };