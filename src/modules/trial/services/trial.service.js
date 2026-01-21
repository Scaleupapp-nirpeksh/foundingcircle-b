/**
 * @fileoverview Trial Service
 * 
 * Handles trial collaboration workflow:
 * - Proposing trials
 * - Accepting/declining trials
 * - Managing trial lifecycle
 * - Collecting feedback
 * 
 * Per PRD: 7/14/21 day trials with check-ins and feedback
 * 
 * @module services/trial
 */

const { Trial, Conversation, Interest, User } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const conversationService = require('../../conversation/services/conversation.service');
const { 
  TRIAL_STATUS,
  TRIAL_OUTCOME,
  CHECKIN_FREQUENCY,
  MESSAGE_TYPES,
} = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');

// ============================================
// TRIAL LIFECYCLE
// ============================================

/**
 * Propose a trial in a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} proposerId - User proposing the trial
 * @param {Object} trialData - Trial configuration
 * @param {number} trialData.durationDays - 7, 14, or 21 days
 * @param {string} trialData.goal - Trial goal/deliverable
 * @param {string} [trialData.checkinFrequency='WEEKLY'] - Check-in frequency
 * @returns {Promise<Object>} Created trial
 */
const proposeTrial = async (conversationId, proposerId, trialData) => {
  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw ApiError.conversationNotFound();
  }
  
  if (!conversation.isParticipant(proposerId)) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  
  // Check if there's already an active or proposed trial
  const existingTrial = await Trial.findOne({
    conversation: conversationId,
    status: { $in: [TRIAL_STATUS.PROPOSED, TRIAL_STATUS.ACTIVE] },
  });
  
  if (existingTrial) {
    throw ApiError.conflict('There is already an active or proposed trial for this conversation');
  }
  
  // Validate duration
  if (![7, 14, 21].includes(trialData.durationDays)) {
    throw ApiError.badRequest('Trial duration must be 7, 14, or 21 days');
  }
  
  // Create trial
  const trial = await Trial.create({
    conversation: conversationId,
    interest: conversation.interest,
    founder: conversation.founder,
    builder: conversation.builder,
    opening: conversation.opening,
    proposedBy: proposerId,
    durationDays: trialData.durationDays,
    goal: trialData.goal,
    checkinFrequency: trialData.checkinFrequency || CHECKIN_FREQUENCY.WEEKLY,
    status: TRIAL_STATUS.PROPOSED,
  });
  
  // Send system message about trial proposal
  await conversationService.sendTrialMessage(
    conversationId,
    MESSAGE_TYPES.TRIAL_PROPOSAL,
    `A ${trialData.durationDays}-day trial has been proposed. Goal: ${trialData.goal}`,
    { trialId: trial._id }
  );
  
  logger.info('Trial proposed', {
    trialId: trial._id,
    conversationId,
    proposerId,
    durationDays: trialData.durationDays,
  });
  
  return trial;
};

/**
 * Accept a trial proposal
 * 
 * @param {string} trialId - Trial ID
 * @param {string} userId - User accepting the trial
 * @returns {Promise<Object>} Updated trial
 */
const acceptTrial = async (trialId, userId) => {
  const trial = await Trial.findById(trialId);
  
  if (!trial) {
    throw ApiError.notFound('Trial not found');
  }
  
  if (!trial.isParticipant(userId)) {
    throw ApiError.forbidden('You are not a participant in this trial');
  }
  
  // Can't accept your own proposal
  if (trial.proposedBy.toString() === userId.toString()) {
    throw ApiError.badRequest('You cannot accept your own trial proposal');
  }
  
  if (trial.status !== TRIAL_STATUS.PROPOSED) {
    throw ApiError.badRequest(`Cannot accept trial with status: ${trial.status}`);
  }
  
  // Accept the trial
  await trial.accept();
  
  // Update conversation with trial reference
  await conversationService.linkTrial(trial.conversation, trial._id);
  
  // Send system message
  await conversationService.sendTrialMessage(
    trial.conversation,
    MESSAGE_TYPES.TRIAL_UPDATE,
    `Trial started! ${trial.durationDays} days to complete: ${trial.goal}`,
    { trialId: trial._id, action: 'started' }
  );
  
  logger.info('Trial accepted', {
    trialId,
    userId,
    endsAt: trial.endsAt,
  });
  
  return trial;
};

/**
 * Decline a trial proposal
 * 
 * @param {string} trialId - Trial ID
 * @param {string} userId - User declining the trial
 * @returns {Promise<Object>} Updated trial
 */
const declineTrial = async (trialId, userId) => {
  const trial = await Trial.findById(trialId);
  
  if (!trial) {
    throw ApiError.notFound('Trial not found');
  }
  
  if (!trial.isParticipant(userId)) {
    throw ApiError.forbidden('You are not a participant in this trial');
  }
  
  if (trial.status !== TRIAL_STATUS.PROPOSED) {
    throw ApiError.badRequest(`Cannot decline trial with status: ${trial.status}`);
  }
  
  // Cancel the trial
  await trial.cancel(userId);
  
  // Send system message
  await conversationService.sendTrialMessage(
    trial.conversation,
    MESSAGE_TYPES.TRIAL_UPDATE,
    'Trial proposal was declined.',
    { trialId: trial._id, action: 'declined' }
  );
  
  logger.info('Trial declined', { trialId, userId });
  
  return trial;
};

/**
 * Cancel an active trial
 * 
 * @param {string} trialId - Trial ID
 * @param {string} userId - User cancelling the trial
 * @param {string} [reason] - Cancellation reason
 * @returns {Promise<Object>} Updated trial
 */
const cancelTrial = async (trialId, userId, reason = null) => {
  const trial = await Trial.findById(trialId);
  
  if (!trial) {
    throw ApiError.notFound('Trial not found');
  }
  
  if (!trial.isParticipant(userId)) {
    throw ApiError.forbidden('You are not a participant in this trial');
  }
  
  if (![TRIAL_STATUS.PROPOSED, TRIAL_STATUS.ACTIVE].includes(trial.status)) {
    throw ApiError.badRequest(`Cannot cancel trial with status: ${trial.status}`);
  }
  
  // Cancel the trial
  await trial.cancel(userId);
  
  // Send system message
  const message = reason 
    ? `Trial was cancelled. Reason: ${reason}`
    : 'Trial was cancelled.';
    
  await conversationService.sendTrialMessage(
    trial.conversation,
    MESSAGE_TYPES.TRIAL_UPDATE,
    message,
    { trialId: trial._id, action: 'cancelled', reason }
  );
  
  logger.info('Trial cancelled', { trialId, userId, reason });
  
  return trial;
};

/**
 * Complete a trial (end it and prompt for feedback)
 * 
 * @param {string} trialId - Trial ID
 * @returns {Promise<Object>} Updated trial
 */
const completeTrial = async (trialId) => {
  const trial = await Trial.findById(trialId);
  
  if (!trial) {
    throw ApiError.notFound('Trial not found');
  }
  
  if (trial.status !== TRIAL_STATUS.ACTIVE) {
    throw ApiError.badRequest(`Cannot complete trial with status: ${trial.status}`);
  }
  
  // Complete the trial
  await trial.complete();
  
  // Send system message
  await conversationService.sendTrialMessage(
    trial.conversation,
    MESSAGE_TYPES.TRIAL_UPDATE,
    'Trial completed! Please provide your feedback.',
    { trialId: trial._id, action: 'completed' }
  );
  
  logger.info('Trial completed', { trialId });
  
  return trial;
};

// ============================================
// FEEDBACK
// ============================================
/**
 * Submit feedback for a trial
 * 
 * @param {string} trialId - Trial ID
 * @param {string} userId - User submitting feedback
 * @param {Object} feedback - Feedback data
 * @param {number} feedback.communication - 1-5 rating
 * @param {number} feedback.reliability - 1-5 rating
 * @param {number} feedback.skillMatch - 1-5 rating
 * @param {boolean} feedback.wouldContinue - Would continue working together
 * @param {string} [feedback.privateNotes] - Private notes
 * @returns {Promise<Object>} Updated trial
 */
const submitFeedback = async (trialId, userId, feedback) => {
    let trial = await Trial.findById(trialId);
    
    if (!trial) {
      throw ApiError.notFound('Trial not found');
    }
    
    if (!trial.isParticipant(userId)) {
      throw ApiError.forbidden('You are not a participant in this trial');
    }
    
    if (trial.status !== TRIAL_STATUS.COMPLETED) {
      throw ApiError.badRequest('Can only submit feedback for completed trials');
    }
    
    // Validate feedback
    const { communication, reliability, skillMatch, wouldContinue, privateNotes } = feedback;
    
    if (!communication || !reliability || !skillMatch || wouldContinue === undefined) {
      throw ApiError.badRequest('All feedback fields are required');
    }
    
    // Determine if user is founder or builder
    const isFounder = trial.founder.toString() === userId.toString();
    
    // Check if already submitted
    if (isFounder && trial.founderFeedback?.submittedAt) {
      throw ApiError.conflict('You have already submitted feedback for this trial');
    }
    
    if (!isFounder && trial.builderFeedback?.submittedAt) {
      throw ApiError.conflict('You have already submitted feedback for this trial');
    }
    
    // Submit feedback
    const feedbackData = {
      communication,
      reliability,
      skillMatch,
      wouldContinue,
      privateNotes: privateNotes || null,
    };
    
    if (isFounder) {
      await trial.submitFounderFeedback(feedbackData);
    } else {
      await trial.submitBuilderFeedback(feedbackData);
    }
    
    // Refetch trial to check if both have submitted
    trial = await Trial.findById(trialId);
    
    // If both have submitted, determine outcome
    if (trial.founderFeedback?.submittedAt && trial.builderFeedback?.submittedAt) {
      const bothContinue = trial.founderFeedback.wouldContinue && trial.builderFeedback.wouldContinue;
      trial.outcome = bothContinue ? TRIAL_OUTCOME.CONTINUE : TRIAL_OUTCOME.END;
      await trial.save();
      
      // Send outcome message
      const outcomeMessage = bothContinue
        ? 'Great news! Both parties want to continue working together.'
        : 'Trial feedback submitted. Thank you for your participation.';
        
      await conversationService.sendTrialMessage(
        trial.conversation,
        MESSAGE_TYPES.TRIAL_UPDATE,
        outcomeMessage,
        { trialId: trial._id, action: 'feedback_complete', outcome: trial.outcome }
      );
    }
    
    logger.info('Trial feedback submitted', {
      trialId,
      userId,
      isFounder,
      wouldContinue,
    });
    
    return trial;
  };

// ============================================
// QUERIES
// ============================================

/**
 * Get trial by ID
 * 
 * @param {string} trialId - Trial ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Trial with details
 */
const getTrialById = async (trialId, userId) => {
    // First check authorization without populate
    const trialCheck = await Trial.findById(trialId);
    
    if (!trialCheck) {
      throw ApiError.notFound('Trial not found');
    }
    
    if (!trialCheck.isParticipant(userId)) {
      throw ApiError.forbidden('You are not a participant in this trial');
    }
    
    // Now fetch with populate
    const trial = await Trial.findById(trialId)
      .populate('founder', 'name email avatarUrl')
      .populate('builder', 'name email avatarUrl')
      .populate('opening', 'title roleType')
      .populate('proposedBy', 'name');
    
    return trial;
  };

/**
 * Get trials for a user
 * 
 * @param {string} userId - User ID
 * @param {Object} [options={}] - Query options
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Promise<Object>} Paginated trials
 */
const getUserTrials = async (userId, options = {}) => {
  const { status, page = 1, limit = 20 } = options;
  
  const query = {
    $or: [{ founder: userId }, { builder: userId }],
  };
  
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  
  const [trials, total] = await Promise.all([
    Trial.find(query)
      .populate('founder', 'name email avatarUrl')
      .populate('builder', 'name email avatarUrl')
      .populate('opening', 'title roleType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Trial.countDocuments(query),
  ]);
  
  return {
    trials,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

/**
 * Get active trials for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Active trials
 */
const getActiveTrials = async (userId) => {
  return Trial.findActiveByUser(userId);
};

/**
 * Get trial for a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object|null>} Trial or null
 */
const getTrialForConversation = async (conversationId, userId) => {
  const trial = await Trial.findOne({
    conversation: conversationId,
    status: { $in: [TRIAL_STATUS.PROPOSED, TRIAL_STATUS.ACTIVE, TRIAL_STATUS.COMPLETED] },
  })
    .populate('proposedBy', 'name')
    .sort({ createdAt: -1 });
  
  if (!trial) {
    return null;
  }
  
  if (!trial.isParticipant(userId)) {
    throw ApiError.forbidden('You are not a participant in this trial');
  }
  
  return trial;
};

// ============================================
// ADMIN/SYSTEM FUNCTIONS
// ============================================

/**
 * Get trials ending soon (for reminder notifications)
 * 
 * @param {number} [daysAhead=2] - Days to look ahead
 * @returns {Promise<Array>} Trials ending soon
 */
const getTrialsEndingSoon = async (daysAhead = 2) => {
  return Trial.findEndingSoon(daysAhead);
};

/**
 * Auto-complete expired trials
 * Called by a scheduled job
 * 
 * @returns {Promise<number>} Number of trials completed
 */
const autoCompleteExpiredTrials = async () => {
  const expiredTrials = await Trial.find({
    status: TRIAL_STATUS.ACTIVE,
    endsAt: { $lte: new Date() },
  });
  
  let completedCount = 0;
  
  for (const trial of expiredTrials) {
    try {
      await completeTrial(trial._id);
      completedCount++;
    } catch (error) {
      logger.error('Failed to auto-complete trial', {
        trialId: trial._id,
        error: error.message,
      });
    }
  }
  
  logger.info('Auto-completed expired trials', { count: completedCount });
  
  return completedCount;
};

/**
 * Get trial statistics for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Trial statistics
 */
const getTrialStats = async (userId) => {
  const stats = await Trial.aggregate([
    {
      $match: {
        $or: [{ founder: userId }, { builder: userId }],
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result = {
    total: 0,
    proposed: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  };
  
  stats.forEach(stat => {
    const key = stat._id.toLowerCase();
    result[key] = stat.count;
    result.total += stat.count;
  });
  
  // Get outcome stats for completed trials
  const outcomeStats = await Trial.aggregate([
    {
      $match: {
        $or: [{ founder: userId }, { builder: userId }],
        status: TRIAL_STATUS.COMPLETED,
      },
    },
    {
      $group: {
        _id: '$outcome',
        count: { $sum: 1 },
      },
    },
  ]);
  
  result.outcomes = {};
  outcomeStats.forEach(stat => {
    result.outcomes[stat._id] = stat.count;
  });
  
  return result;
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Lifecycle
  proposeTrial,
  acceptTrial,
  declineTrial,
  cancelTrial,
  completeTrial,
  
  // Feedback
  submitFeedback,
  
  // Queries
  getTrialById,
  getUserTrials,
  getActiveTrials,
  getTrialForConversation,
  
  // Admin/System
  getTrialsEndingSoon,
  autoCompleteExpiredTrials,
  getTrialStats,
};
