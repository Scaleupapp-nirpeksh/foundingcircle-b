/**
 * @fileoverview Matching Service
 * 
 * Implements the matching algorithm per PRD Section 8:
 * - Hard filters (deal-breakers)
 * - Soft scoring factors
 * - Compatibility calculation
 * - Daily match generation
 * 
 * Match Score Formula:
 * Score = (Compensation × 0.30) + (Commitment × 0.20) + (Stage × 0.15) + 
 *         (Skills × 0.15) + (Scenario × 0.10) + (Geography × 0.10)
 * 
 * @module services/matching
 */

const { 
    User, 
    FounderProfile, 
    BuilderProfile, 
    Opening, 
    Match,
    ScenarioResponse,
  } = require('../../models');
const { ApiError } = require('../../../shared/utils');
const { 
    MATCH_STATUS,
    MATCH_ACTIONS,
    STARTUP_STAGES,
    RISK_APPETITES,
    COMPENSATION_TYPES,
    ROLE_TYPES,
    REMOTE_PREFERENCES,
  } = require('../../../shared/constants');
const profileService = require('../../profile/services/profile.service');
const logger = require('../../../shared/utils/logger');
  
  // ============================================
  // CONSTANTS & WEIGHTS
  // ============================================
  
  /**
   * Matching algorithm weights per PRD Section 8.4
   */
  const WEIGHTS = {
    COMPENSATION: 0.30,
    COMMITMENT: 0.20,
    STAGE: 0.15,
    SKILLS: 0.15,
    SCENARIO: 0.10,
    GEOGRAPHY: 0.10,
  };
  
  /**
   * Stage compatibility matrix per PRD Section 8.4
   * Risk appetite vs Startup stage
   */
  const STAGE_COMPATIBILITY = {
    [RISK_APPETITES.HIGH]: {
      [STARTUP_STAGES.IDEA]: 100,
      [STARTUP_STAGES.MVP_PROGRESS]: 100,
      [STARTUP_STAGES.MVP_LIVE]: 100,
      [STARTUP_STAGES.EARLY_REVENUE]: 80,
    },
    [RISK_APPETITES.MEDIUM]: {
      [STARTUP_STAGES.IDEA]: 60,
      [STARTUP_STAGES.MVP_PROGRESS]: 100,
      [STARTUP_STAGES.MVP_LIVE]: 100,
      [STARTUP_STAGES.EARLY_REVENUE]: 100,
    },
    [RISK_APPETITES.LOW]: {
      [STARTUP_STAGES.IDEA]: 0, // Hard filtered
      [STARTUP_STAGES.MVP_PROGRESS]: 60,
      [STARTUP_STAGES.MVP_LIVE]: 100,
      [STARTUP_STAGES.EARLY_REVENUE]: 100,
    },
  };
  
  /**
   * Minimum commitment ratio before hard filter
   */
  const MIN_COMMITMENT_RATIO = 0.4;
  
  /**
   * Match score thresholds
   */
  const SCORE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 75,
    FAIR: 60,
    WEAK: 0,
  };
  
  // ============================================
  // HARD FILTERS (DEAL-BREAKERS)
  // ============================================
  
  /**
   * Apply hard filters to determine if match is possible
   * Per PRD Section 8.3
   * 
   * @param {Object} opening - Opening document
   * @param {Object} founderProfile - Founder's profile
   * @param {Object} builderProfile - Builder's profile
   * @returns {Object} { passes: boolean, reason: string|null }
   */
  const applyHardFilters = (opening, founderProfile, builderProfile) => {
    // Filter 1: Compensation Mismatch
    // Founder offers equity-only AND Builder wants paid-only
    const founderOffersEquityOnly = opening.cashRange.max === 0;
    const builderWantsPaidOnly = 
      builderProfile.compensationOpenness.length === 1 && 
      builderProfile.compensationOpenness.includes(COMPENSATION_TYPES.PAID_ONLY);
    
    if (founderOffersEquityOnly && builderWantsPaidOnly) {
      return {
        passes: false,
        reason: 'Compensation mismatch: Founder offers equity-only, builder wants paid-only',
      };
    }
    
    // Filter 2: Commitment Gap > 50%
    // Builder offers less than 40% of founder's requirement
    const commitmentRatio = builderProfile.hoursPerWeek / opening.hoursPerWeek;
    if (commitmentRatio < MIN_COMMITMENT_RATIO) {
      return {
        passes: false,
        reason: `Commitment gap too large: Builder offers ${builderProfile.hoursPerWeek}hrs, opening requires ${opening.hoursPerWeek}hrs`,
      };
    }
    
    // Filter 3: Risk Mismatch
    // Low risk builder + Idea stage startup
    if (
      builderProfile.riskAppetite === RISK_APPETITES.LOW && 
      founderProfile.startupStage === STARTUP_STAGES.IDEA
    ) {
      return {
        passes: false,
        reason: 'Risk mismatch: Low risk builder cannot match with idea-stage startup',
      };
    }
    
    // Filter 4: Role Mismatch
    // Opening role type not in builder's interested roles
    if (
      builderProfile.rolesInterested && 
      builderProfile.rolesInterested.length > 0 &&
      !builderProfile.rolesInterested.includes(opening.roleType)
    ) {
      return {
        passes: false,
        reason: `Role mismatch: Builder interested in ${builderProfile.rolesInterested.join(', ')}, opening is ${opening.roleType}`,
      };
    }
    
    // Filter 5: Geography Block
    // Founder requires on-site AND Builder is remote-only
    if (
      opening.remotePreference === REMOTE_PREFERENCES.ONSITE && 
      builderProfile.remotePreference === REMOTE_PREFERENCES.REMOTE
    ) {
      return {
        passes: false,
        reason: 'Geography mismatch: Opening requires on-site, builder is remote-only',
      };
    }
    
    return { passes: true, reason: null };
  };
  
  // ============================================
  // SOFT SCORING FACTORS
  // ============================================
  
  /**
   * Calculate compensation alignment score
   * Per PRD Section 8.4 - Factor 1 (Weight: 30%)
   * 
   * @param {Object} opening - Opening with equity/cash ranges
   * @param {Object} builderProfile - Builder's compensation openness
   * @returns {number} Score 0-100
   */
  const calculateCompensationScore = (opening, builderProfile) => {
    const { compensationOpenness } = builderProfile;
    const hasEquity = opening.equityRange.max > 0;
    const hasCash = opening.cashRange.max > 0;
    
    // Check what builder accepts
    const acceptsEquityOnly = compensationOpenness.includes(COMPENSATION_TYPES.EQUITY_ONLY);
    const acceptsEquityStipend = compensationOpenness.includes(COMPENSATION_TYPES.EQUITY_STIPEND);
    const acceptsInternship = compensationOpenness.includes(COMPENSATION_TYPES.INTERNSHIP);
    const acceptsPaidOnly = compensationOpenness.includes(COMPENSATION_TYPES.PAID_ONLY);
    
    // Perfect matches
    if (hasEquity && !hasCash && acceptsEquityOnly) return 100;
    if (hasEquity && hasCash && acceptsEquityStipend) return 100;
    if (hasCash && acceptsPaidOnly) return 100;
    if (hasEquity && hasCash && acceptsInternship) return 100;
    
    // Partial matches
    if (hasEquity && hasCash && acceptsEquityOnly) return 75; // Builder accepts less
    if (hasEquity && !hasCash && acceptsEquityStipend) return 50; // Builder wants more
    if (hasEquity && acceptsPaidOnly) return 25; // Distant but equity available
    
    // Basic overlap check
    let score = 0;
    if (hasEquity && (acceptsEquityOnly || acceptsEquityStipend)) score += 50;
    if (hasCash && (acceptsEquityStipend || acceptsPaidOnly || acceptsInternship)) score += 50;
    
    return Math.min(score, 100);
  };
  
  /**
   * Calculate commitment overlap score
   * Per PRD Section 8.4 - Factor 2 (Weight: 20%)
   * 
   * @param {Object} opening - Opening with hours requirement
   * @param {Object} builderProfile - Builder's availability
   * @returns {number} Score 0-100
   */
  const calculateCommitmentScore = (opening, builderProfile) => {
    const required = opening.hoursPerWeek;
    const available = builderProfile.hoursPerWeek;
    
    if (available >= required) return 100;
    
    const ratio = available / required;
    
    if (ratio >= 0.8) return 80;
    if (ratio >= 0.6) return 60;
    if (ratio >= 0.4) return 40;
    
    return 0; // Should have been hard filtered
  };
  
  /**
   * Calculate stage compatibility score
   * Per PRD Section 8.4 - Factor 3 (Weight: 15%)
   * 
   * @param {Object} founderProfile - Founder's startup stage
   * @param {Object} builderProfile - Builder's risk appetite
   * @returns {number} Score 0-100
   */
  const calculateStageScore = (founderProfile, builderProfile) => {
    const stage = founderProfile.startupStage;
    const risk = builderProfile.riskAppetite;
    
    if (STAGE_COMPATIBILITY[risk] && STAGE_COMPATIBILITY[risk][stage] !== undefined) {
      return STAGE_COMPATIBILITY[risk][stage];
    }
    
    // Default to medium compatibility
    return 50;
  };
  
  /**
   * Calculate skill match score
   * Per PRD Section 8.4 - Factor 4 (Weight: 15%)
   * 
   * @param {Object} opening - Opening with required skills
   * @param {Object} builderProfile - Builder's skills
   * @returns {number} Score 0-100
   */
  const calculateSkillScore = (opening, builderProfile) => {
    const required = opening.skillsRequired || [];
    const available = builderProfile.skills || [];
    
    if (required.length === 0) return 100; // No specific skills required
    
    // Case-insensitive comparison
    const requiredLower = required.map(s => s.toLowerCase());
    const availableLower = available.map(s => s.toLowerCase());
    
    const matched = requiredLower.filter(skill => 
      availableLower.some(s => s.includes(skill) || skill.includes(s))
    );
    
    const matchRatio = matched.length / required.length;
    return Math.round(matchRatio * 100);
  };
  
  /**
   * Calculate scenario compatibility score
   * Per PRD Section 8.4 - Factor 5 (Weight: 10%)
   * 
   * @param {string} founderId - Founder user ID
   * @param {string} builderId - Builder user ID
   * @returns {Promise<number>} Score 0-100
   */
  const calculateScenarioScore = async (founderId, builderId) => {
    const compatibility = await profileService.calculateScenarioCompatibility(founderId, builderId);
    
    if (compatibility.score === null) {
      // If scenarios not completed, return neutral score
      return 50;
    }
    
    return compatibility.score;
  };
  
  /**
   * Calculate geography score
   * Per PRD Section 8.4 - Factor 6 (Weight: 10%)
   * 
   * @param {Object} opening - Opening location preferences
   * @param {Object} builderProfile - Builder location
   * @param {Object} founderProfile - Founder location
   * @returns {number} Score 0-100
   */
  const calculateGeographyScore = (opening, builderProfile, founderProfile) => {
    // Both prefer remote
    if (
      opening.remotePreference === REMOTE_PREFERENCES.REMOTE && 
      builderProfile.remotePreference === REMOTE_PREFERENCES.REMOTE
    ) {
      return 100;
    }
    
    // Check city match
    const founderCity = founderProfile.location?.city?.toLowerCase();
    const builderCity = builderProfile.location?.city?.toLowerCase();
    
    if (founderCity && builderCity && founderCity === builderCity) {
      return 100;
    }
    
    // Same country
    const founderCountry = founderProfile.location?.country?.toLowerCase();
    const builderCountry = builderProfile.location?.country?.toLowerCase();
    
    if (founderCountry && builderCountry && founderCountry === builderCountry) {
      return 75;
    }
    
    // Both flexible (hybrid)
    if (
      opening.remotePreference === REMOTE_PREFERENCES.HYBRID || 
      builderProfile.remotePreference === REMOTE_PREFERENCES.HYBRID
    ) {
      return 50;
    }
    
    // Different countries, different preferences
    return 25;
  };
  
  // ============================================
  // MAIN MATCHING FUNCTIONS
  // ============================================
  
  /**
   * Calculate full compatibility score between an opening and a builder
   * 
   * @param {Object} opening - Opening document
   * @param {Object} founderProfile - Founder's profile
   * @param {Object} builderProfile - Builder's profile
   * @param {string} founderId - Founder user ID
   * @param {string} builderId - Builder user ID
   * @returns {Promise<Object>} Match score and breakdown
   */
  const calculateCompatibility = async (opening, founderProfile, builderProfile, founderId, builderId) => {
    // First apply hard filters
    const hardFilterResult = applyHardFilters(opening, founderProfile, builderProfile);
    
    if (!hardFilterResult.passes) {
      return {
        score: 0,
        passes: false,
        reason: hardFilterResult.reason,
        breakdown: null,
      };
    }
    
    // Calculate individual scores
    const compensationScore = calculateCompensationScore(opening, builderProfile);
    const commitmentScore = calculateCommitmentScore(opening, builderProfile);
    const stageScore = calculateStageScore(founderProfile, builderProfile);
    const skillScore = calculateSkillScore(opening, builderProfile);
    const scenarioScore = await calculateScenarioScore(founderId, builderId);
    const geographyScore = calculateGeographyScore(opening, builderProfile, founderProfile);
    
    // Calculate weighted total
    const totalScore = Math.round(
      (compensationScore * WEIGHTS.COMPENSATION) +
      (commitmentScore * WEIGHTS.COMMITMENT) +
      (stageScore * WEIGHTS.STAGE) +
      (skillScore * WEIGHTS.SKILLS) +
      (scenarioScore * WEIGHTS.SCENARIO) +
      (geographyScore * WEIGHTS.GEOGRAPHY)
    );
    
    // Determine match quality
    let quality = 'WEAK';
    if (totalScore >= SCORE_THRESHOLDS.EXCELLENT) quality = 'EXCELLENT';
    else if (totalScore >= SCORE_THRESHOLDS.GOOD) quality = 'GOOD';
    else if (totalScore >= SCORE_THRESHOLDS.FAIR) quality = 'FAIR';
    
    return {
      score: totalScore,
      passes: true,
      quality,
      breakdown: {
        compensation: { score: compensationScore, weight: WEIGHTS.COMPENSATION, weighted: Math.round(compensationScore * WEIGHTS.COMPENSATION) },
        commitment: { score: commitmentScore, weight: WEIGHTS.COMMITMENT, weighted: Math.round(commitmentScore * WEIGHTS.COMMITMENT) },
        stage: { score: stageScore, weight: WEIGHTS.STAGE, weighted: Math.round(stageScore * WEIGHTS.STAGE) },
        skills: { score: skillScore, weight: WEIGHTS.SKILLS, weighted: Math.round(skillScore * WEIGHTS.SKILLS) },
        scenario: { score: scenarioScore, weight: WEIGHTS.SCENARIO, weighted: Math.round(scenarioScore * WEIGHTS.SCENARIO) },
        geography: { score: geographyScore, weight: WEIGHTS.GEOGRAPHY, weighted: Math.round(geographyScore * WEIGHTS.GEOGRAPHY) },
      },
    };
  };
  
  /**
   * Generate matches for a specific opening
   * 
   * @param {string} openingId - Opening ID
   * @param {Object} [options={}] - Options
   * @param {number} [options.limit=50] - Max matches to generate
   * @param {number} [options.minScore=60] - Minimum score to include
   * @returns {Promise<Object[]>} Array of matches with scores
   */
  const generateMatchesForOpening = async (openingId, options = {}) => {
    const { limit = 50, minScore = 60 } = options;
    
    // Get opening with founder profile
    const opening = await Opening.findById(openingId)
      .populate('founder')
      .populate('founderProfile');
    
    if (!opening) {
      throw ApiError.notFound('Opening not found');
    }
    
    if (opening.status !== 'ACTIVE') {
      throw ApiError.badRequest('Opening is not active');
    }
    
    // Get all eligible builders
    const builderProfiles = await BuilderProfile.find({
      isComplete: true,
      isVisible: true,
      isOpenToOpportunities: true,
    }).populate('user');
    
    const matches = [];
    
    for (const builderProfile of builderProfiles) {
      // Skip if builder is the founder (dual profile case)
      if (builderProfile.user._id.toString() === opening.founder._id.toString()) {
        continue;
      }
      
      try {
        const compatibility = await calculateCompatibility(
          opening,
          opening.founderProfile,
          builderProfile,
          opening.founder._id,
          builderProfile.user._id
        );
        
        if (compatibility.passes && compatibility.score >= minScore) {
          matches.push({
            builder: builderProfile.user._id,
            builderProfile: builderProfile._id,
            compatibility,
          });
        }
      } catch (error) {
        logger.warn('Error calculating compatibility', {
          openingId,
          builderId: builderProfile.user._id,
          error: error.message,
        });
      }
    }
    
    // Sort by score descending and limit
    matches.sort((a, b) => b.compatibility.score - a.compatibility.score);
    
    return matches.slice(0, limit);
  };
  
  /**
   * Generate matches for a specific builder
   * 
   * @param {string} builderId - Builder user ID
   * @param {Object} [options={}] - Options
   * @param {number} [options.limit=50] - Max matches to generate
   * @param {number} [options.minScore=60] - Minimum score to include
   * @returns {Promise<Object[]>} Array of matches with scores
   */
  const generateMatchesForBuilder = async (builderId, options = {}) => {
    const { limit = 50, minScore = 60 } = options;
    
    // Get builder profile
    const builderProfile = await BuilderProfile.findOne({ user: builderId })
      .populate('user');
    
    if (!builderProfile) {
      throw ApiError.notFound('Builder profile not found');
    }
    
    if (!builderProfile.isComplete) {
      throw ApiError.badRequest('Builder profile is not complete');
    }
    
    // Get all active openings
    const openings = await Opening.find({ status: 'ACTIVE' })
      .populate('founder')
      .populate('founderProfile');
    
    const matches = [];
    
    for (const opening of openings) {
      // Skip if builder is the founder (dual profile case)
      if (opening.founder._id.toString() === builderId.toString()) {
        continue;
      }
      
      try {
        const compatibility = await calculateCompatibility(
          opening,
          opening.founderProfile,
          builderProfile,
          opening.founder._id,
          builderId
        );
        
        if (compatibility.passes && compatibility.score >= minScore) {
          matches.push({
            opening: opening._id,
            founder: opening.founder._id,
            founderProfile: opening.founderProfile._id,
            compatibility,
          });
        }
      } catch (error) {
        logger.warn('Error calculating compatibility', {
          builderId,
          openingId: opening._id,
          error: error.message,
        });
      }
    }
    
    // Sort by score descending and limit
    matches.sort((a, b) => b.compatibility.score - a.compatibility.score);
    
    return matches.slice(0, limit);
  };
  
  /**
   * Create or update match record
   * 
   * @param {Object} matchData - Match data
   * @returns {Promise<Object>} Created/updated match
   */
  const upsertMatch = async (matchData) => {
    const {
      founder,
      builder,
      opening,
      founderProfile,
      builderProfile,
      compatibilityScore,
      scoreBreakdown,
    } = matchData;
    
    // Check if match already exists
    let match = await Match.findOne({
      founder,
      builder,
      opening,
    });
    
    if (match) {
      // Update existing match
      match.compatibilityScore = compatibilityScore;
      match.scoreBreakdown = scoreBreakdown;
      await match.save();
      logger.debug('Match updated', { matchId: match._id });
    } else {
      // Create new match
      match = await Match.create({
        founder,
        builder,
        opening,
        founderProfile,
        builderProfile,
        compatibilityScore,
        scoreBreakdown,
        status: MATCH_STATUS.PENDING,
      });
      logger.info('Match created', { matchId: match._id });
    }
    
    return match;
  };
  
  /**
   * Get daily matches for a founder
   * 
   * @param {string} founderId - Founder user ID
   * @param {Object} [options={}] - Options
   * @param {number} [options.limit=5] - Number of matches (5 for free, unlimited for Pro)
   * @returns {Promise<Object[]>} Daily matches
   */
  const getDailyMatchesForFounder = async (founderId, options = {}) => {
    const { limit = 5 } = options;
    
    // Get founder's active openings
    const openings = await Opening.find({ 
      founder: founderId, 
      status: 'ACTIVE',
    });
    
    if (openings.length === 0) {
      return [];
    }
    
    const allMatches = [];
    
    for (const opening of openings) {
      const matches = await Match.find({
        opening: opening._id,
        status: { $in: [MATCH_STATUS.PENDING, MATCH_STATUS.LIKED] },
        founderAction: { $in: [null, MATCH_ACTIONS.SAVE] }, // Not yet acted on or saved
      })
        .populate('builder', 'name email avatarUrl')
        .populate('builderProfile', 'displayName skills riskAppetite hoursPerWeek intentStatement')
        .sort('-compatibilityScore')
        .limit(limit);
      
      allMatches.push(...matches);
    }
    
    // Sort all matches by score and limit
    allMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    return allMatches.slice(0, limit);
  };
  
  /**
   * Get daily matches for a builder
   * 
   * @param {string} builderId - Builder user ID
   * @param {Object} [options={}] - Options
   * @param {number} [options.limit=5] - Number of matches (5 for free, 15 for Boost)
   * @returns {Promise<Object[]>} Daily matches
   */
  const getDailyMatchesForBuilder = async (builderId, options = {}) => {
    const { limit = 5 } = options;
    
    const matches = await Match.find({
      builder: builderId,
      status: { $in: [MATCH_STATUS.PENDING, MATCH_STATUS.LIKED] },
      builderAction: { $in: [null, MATCH_ACTIONS.SAVE] }, // Not yet acted on or saved
    })
      .populate('founder', 'name email avatarUrl')
      .populate('founderProfile', 'startupName startupStage intentStatement')
      .populate('opening', 'title roleType equityRange cashRange hoursPerWeek')
      .sort('-compatibilityScore')
      .limit(limit);
    
    return matches;
  };
  
  /**
   * Record a match action (like, skip, save)
   * 
   * @param {string} matchId - Match ID
   * @param {string} userId - User ID taking action
   * @param {string} action - Action (LIKE, SKIP, SAVE)
   * @returns {Promise<Object>} Updated match with mutual status
   */
  const recordMatchAction = async (matchId, userId, action) => {
    const match = await Match.findById(matchId);
    
    if (!match) {
      throw ApiError.notFound('Match not found');
    }
    
    // Validate action
    if (!Object.values(MATCH_ACTIONS).includes(action)) {
      throw ApiError.badRequest('Invalid action');
    }
    
    // Determine if user is founder or builder
    const isFounder = match.founder.toString() === userId.toString();
    const isBuilder = match.builder.toString() === userId.toString();
    
    if (!isFounder && !isBuilder) {
      throw ApiError.forbidden('You are not a participant in this match');
    }
    
    // Record action
    if (isFounder) {
      match.founderAction = action;
      match.founderActionAt = new Date();
    } else {
      match.builderAction = action;
      match.builderActionAt = new Date();
    }
    
    // Check for mutual interest
    const wasMutual = match.isMutual;
    
    if (
      match.founderAction === MATCH_ACTIONS.LIKE && 
      match.builderAction === MATCH_ACTIONS.LIKE
    ) {
      match.isMutual = true;
      match.matchedAt = new Date();
      match.status = MATCH_STATUS.MUTUAL;
    } else if (
      match.founderAction === MATCH_ACTIONS.SKIP || 
      match.builderAction === MATCH_ACTIONS.SKIP
    ) {
      match.status = MATCH_STATUS.SKIPPED;
    }
    
    await match.save();
    
    logger.info('Match action recorded', {
      matchId,
      userId,
      action,
      isFounder,
      isMutual: match.isMutual,
    });
    
    return {
      match,
      newlyMutual: !wasMutual && match.isMutual,
    };
  };
  
  /**
   * Get mutual matches for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object[]>} Mutual matches
   */
  const getMutualMatches = async (userId) => {
    const matches = await Match.find({
      $or: [{ founder: userId }, { builder: userId }],
      isMutual: true,
    })
      .populate('founder', 'name email avatarUrl')
      .populate('builder', 'name email avatarUrl')
      .populate('founderProfile', 'startupName startupStage')
      .populate('builderProfile', 'displayName skills')
      .populate('opening', 'title roleType')
      .sort('-matchedAt');
    
    return matches;
  };
  
  /**
   * Run nightly match generation job
   * Generates matches for all active openings and builders
   * 
   * @returns {Promise<Object>} Job result summary
   */
  const runNightlyMatchGeneration = async () => {
    const startTime = Date.now();
    let openingsProcessed = 0;
    let matchesCreated = 0;
    let matchesUpdated = 0;
    let errors = 0;
    
    logger.info('Starting nightly match generation');
    
    try {
      // Get all active openings
      const openings = await Opening.find({ status: 'ACTIVE' })
        .populate('founder')
        .populate('founderProfile');
      
      for (const opening of openings) {
        try {
          const matches = await generateMatchesForOpening(opening._id, { minScore: 50 });
          
          for (const matchData of matches) {
            const existingMatch = await Match.findOne({
              founder: opening.founder._id,
              builder: matchData.builder,
              opening: opening._id,
            });
            
            if (existingMatch) {
              existingMatch.compatibilityScore = matchData.compatibility.score;
              existingMatch.scoreBreakdown = matchData.compatibility.breakdown;
              await existingMatch.save();
              matchesUpdated++;
            } else {
              await Match.create({
                founder: opening.founder._id,
                builder: matchData.builder,
                opening: opening._id,
                founderProfile: opening.founderProfile._id,
                builderProfile: matchData.builderProfile,
                compatibilityScore: matchData.compatibility.score,
                scoreBreakdown: matchData.compatibility.breakdown,
                status: MATCH_STATUS.PENDING,
              });
              matchesCreated++;
            }
          }
          
          openingsProcessed++;
        } catch (error) {
          logger.error('Error processing opening', {
            openingId: opening._id,
            error: error.message,
          });
          errors++;
        }
      }
      
      const duration = Date.now() - startTime;
      
      logger.info('Nightly match generation completed', {
        openingsProcessed,
        matchesCreated,
        matchesUpdated,
        errors,
        durationMs: duration,
      });
      
      return {
        success: true,
        openingsProcessed,
        matchesCreated,
        matchesUpdated,
        errors,
        durationMs: duration,
      };
    } catch (error) {
      logger.error('Nightly match generation failed', { error: error.message });
      throw error;
    }
  };
  
  // ============================================
  // EXPORTS
  // ============================================
  
  module.exports = {
    // Constants
    WEIGHTS,
    SCORE_THRESHOLDS,
    
    // Hard filters
    applyHardFilters,
    
    // Individual scoring
    calculateCompensationScore,
    calculateCommitmentScore,
    calculateStageScore,
    calculateSkillScore,
    calculateScenarioScore,
    calculateGeographyScore,
    
    // Main matching
    calculateCompatibility,
    generateMatchesForOpening,
    generateMatchesForBuilder,
    upsertMatch,
    
    // Daily matches
    getDailyMatchesForFounder,
    getDailyMatchesForBuilder,
    
    // Actions
    recordMatchAction,
    getMutualMatches,
    
    // Jobs
    runNightlyMatchGeneration,
  };
