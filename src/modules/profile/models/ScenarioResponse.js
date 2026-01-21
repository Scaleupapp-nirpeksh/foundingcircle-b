/**
 * @fileoverview ScenarioResponse model - Working style compatibility quiz
 * 
 * Stores user responses to 6 scenario-based questions that assess
 * working style preferences. Used for compatibility matching.
 * 
 * Scenarios:
 * 1. The 2 AM Crisis - Crisis response
 * 2. The Co-founder Disagreement - Conflict resolution
 * 3. The Underperforming Teammate - People management
 * 4. The Runway Crunch - Financial decisions
 * 5. The Competitor Launch - Competitive response
 * 6. The Equity Negotiation - Negotiation style
 * 
 * @module models/ScenarioResponse
 */

const mongoose = require('mongoose');
const { SCENARIO_OPTIONS } = require('../../../shared/constants');

const { Schema } = mongoose;

// ============================================
// SCENARIO DEFINITIONS
// ============================================

/**
 * Scenario definitions with questions and options
 * This is the source of truth for scenario content
 */
const SCENARIOS = {
  scenario1: {
    id: 'crisis_response',
    title: 'The 2 AM Crisis',
    context: 'Critical bug discovered. Investor demo in 7 hours.',
    options: {
      A: 'Pull all-nighter, fix immediately',
      B: 'Assess severity, sleep if not critical, fix with clear head',
      C: 'Wake team immediately, all hands on deck',
      D: 'Push the demo, never present broken product',
    },
    // Adjacent pairs for scoring (options that are somewhat similar)
    adjacentPairs: [['A', 'C'], ['B', 'D']],
  },
  scenario2: {
    id: 'conflict_resolution',
    title: 'The Co-founder Disagreement',
    context: 'Fundamental product direction disagreement for 2 weeks.',
    options: {
      A: 'Expertise-based authority — expert decides',
      B: 'Data-driven — run experiments, let data decide',
      C: 'External arbitration — bring in advisor',
      D: 'Disagree and commit — one person decides, both align',
    },
    adjacentPairs: [['A', 'D'], ['B', 'C']],
  },
  scenario3: {
    id: 'people_management',
    title: 'The Underperforming Teammate',
    context: 'First hire at 40% expected output after 6 weeks.',
    options: {
      A: 'Direct conversation, 2-week improvement window, then decide',
      B: 'Part ways quickly — can\'t carry passengers early stage',
      C: 'Role adjustment — maybe wrong seat, not wrong bus',
      D: 'More patience — 6 weeks isn\'t enough to judge',
    },
    adjacentPairs: [['A', 'C'], ['B', 'A']],
  },
  scenario4: {
    id: 'financial_decisions',
    title: 'The Runway Crunch',
    context: '3 months runway, revenue not growing fast enough.',
    options: {
      A: 'Cut costs aggressively to extend runway',
      B: 'Double down on growth, burn to hit numbers',
      C: 'Start fundraising immediately',
      D: 'Revenue shortcuts — consulting, services, anything',
    },
    adjacentPairs: [['A', 'D'], ['B', 'C']],
  },
  scenario5: {
    id: 'competitive_response',
    title: 'The Competitor Launch',
    context: 'Well-funded competitor ships feature you\'ve built for 3 months.',
    options: {
      A: 'Ship now — second is fine if better',
      B: 'Pivot — find angle they\'re not covering',
      C: 'Ignore — focus on users, not competitors',
      D: 'Study them — learn from their launch before shipping',
    },
    adjacentPairs: [['A', 'D'], ['B', 'C']],
  },
  scenario6: {
    id: 'negotiation_style',
    title: 'The Equity Negotiation',
    context: 'Talented person wants 5%, you think they deserve 2%.',
    options: {
      A: 'Meet middle — relationship over negotiation',
      B: 'Hold firm — explain reasoning, take it or leave it',
      C: 'Milestone-based — 2% now, path to 4% on performance',
      D: 'Understand first — ask them to justify before countering',
    },
    adjacentPairs: [['A', 'C'], ['B', 'D']],
  },
};

// ============================================
// SCHEMA DEFINITION
// ============================================

const scenarioResponseSchema = new Schema(
  {
    // ==========================================
    // USER REFERENCE
    // ==========================================

    /**
     * Reference to the User document
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },

    // ==========================================
    // SCENARIO RESPONSES
    // ==========================================

    /**
     * Response to Scenario 1: The 2 AM Crisis
     */
    scenario1: {
      type: String,
      enum: {
        values: Object.values(SCENARIO_OPTIONS),
        message: 'Invalid option for scenario 1',
      },
      required: [true, 'Response to scenario 1 is required'],
    },

    /**
     * Response to Scenario 2: The Co-founder Disagreement
     */
    scenario2: {
      type: String,
      enum: {
        values: Object.values(SCENARIO_OPTIONS),
        message: 'Invalid option for scenario 2',
      },
      required: [true, 'Response to scenario 2 is required'],
    },

    /**
     * Response to Scenario 3: The Underperforming Teammate
     */
    scenario3: {
      type: String,
      enum: {
        values: Object.values(SCENARIO_OPTIONS),
        message: 'Invalid option for scenario 3',
      },
      required: [true, 'Response to scenario 3 is required'],
    },

    /**
     * Response to Scenario 4: The Runway Crunch
     */
    scenario4: {
      type: String,
      enum: {
        values: Object.values(SCENARIO_OPTIONS),
        message: 'Invalid option for scenario 4',
      },
      required: [true, 'Response to scenario 4 is required'],
    },

    /**
     * Response to Scenario 5: The Competitor Launch
     */
    scenario5: {
      type: String,
      enum: {
        values: Object.values(SCENARIO_OPTIONS),
        message: 'Invalid option for scenario 5',
      },
      required: [true, 'Response to scenario 5 is required'],
    },

    /**
     * Response to Scenario 6: The Equity Negotiation
     */
    scenario6: {
      type: String,
      enum: {
        values: Object.values(SCENARIO_OPTIONS),
        message: 'Invalid option for scenario 6',
      },
      required: [true, 'Response to scenario 6 is required'],
    },

    // ==========================================
    // METADATA
    // ==========================================

    /**
     * When the assessment was completed
     */
    completedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * Number of times retaken
     */
    retakeCount: {
      type: Number,
      default: 0,
    },

    /**
     * Last retake date
     */
    lastRetakeAt: {
      type: Date,
      default: null,
    },

    /**
     * Time taken to complete (in seconds)
     */
    completionTime: {
      type: Number,
      default: null,
    },

    /**
     * Whether user skipped any initially (for analytics)
     */
    hadSkippedResponses: {
      type: Boolean,
      default: false,
    },

    /**
     * Version of scenarios (for future updates)
     */
    scenarioVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    // ==========================================
    // SCHEMA OPTIONS
    // ==========================================

    timestamps: true,

    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

// ============================================
// INDEXES
// ============================================

scenarioResponseSchema.index({ completedAt: -1 });
scenarioResponseSchema.index({ createdAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if user can retake the assessment
 * Users can retake once per 30 days
 */
scenarioResponseSchema.virtual('canRetake').get(function () {
  if (!this.lastRetakeAt && !this.completedAt) return true;
  
  const lastDate = this.lastRetakeAt || this.completedAt;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return lastDate < thirtyDaysAgo;
});

/**
 * Days until user can retake
 */
scenarioResponseSchema.virtual('daysUntilRetake').get(function () {
  if (this.canRetake) return 0;
  
  const lastDate = this.lastRetakeAt || this.completedAt;
  const retakeDate = new Date(lastDate);
  retakeDate.setDate(retakeDate.getDate() + 30);
  
  const daysRemaining = Math.ceil((retakeDate - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
});

/**
 * Get all responses as an object
 */
scenarioResponseSchema.virtual('responses').get(function () {
  return {
    scenario1: this.scenario1,
    scenario2: this.scenario2,
    scenario3: this.scenario3,
    scenario4: this.scenario4,
    scenario5: this.scenario5,
    scenario6: this.scenario6,
  };
});

/**
 * Get responses as array
 */
scenarioResponseSchema.virtual('responsesArray').get(function () {
  return [
    this.scenario1,
    this.scenario2,
    this.scenario3,
    this.scenario4,
    this.scenario5,
    this.scenario6,
  ];
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Calculate compatibility score with another user's responses
 * @param {ScenarioResponse} otherResponses - Other user's scenario responses
 * @returns {Object} Compatibility result with score and breakdown
 */
scenarioResponseSchema.methods.calculateCompatibility = function (otherResponses) {
  const scenarioKeys = ['scenario1', 'scenario2', 'scenario3', 'scenario4', 'scenario5', 'scenario6'];
  let totalScore = 0;
  const breakdown = {};

  for (const key of scenarioKeys) {
    const myResponse = this[key];
    const theirResponse = otherResponses[key];
    const scenario = SCENARIOS[key];
    
    let score = 0;
    let matchType = 'opposite';

    if (myResponse === theirResponse) {
      // Exact match: 10 points
      score = 10;
      matchType = 'exact';
    } else if (scenario.adjacentPairs.some(pair => 
      pair.includes(myResponse) && pair.includes(theirResponse)
    )) {
      // Adjacent match: 5 points
      score = 5;
      matchType = 'adjacent';
    }
    // Opposite: 0 points (default)

    totalScore += score;
    breakdown[key] = {
      title: scenario.title,
      myResponse,
      theirResponse,
      score,
      maxScore: 10,
      matchType,
    };
  }

  // Normalize to 100%
  const maxScore = 60;
  const percentageScore = Math.round((totalScore / maxScore) * 100);

  return {
    score: percentageScore,
    rawScore: totalScore,
    maxRawScore: maxScore,
    breakdown,
    interpretation: this.getScoreInterpretation(percentageScore),
  };
};

/**
 * Get interpretation of compatibility score
 * @param {number} score - Percentage score (0-100)
 * @returns {Object} Interpretation with level and description
 */
scenarioResponseSchema.methods.getScoreInterpretation = function (score) {
  if (score >= 90) {
    return {
      level: 'EXCELLENT',
      description: 'Highly aligned working styles',
      color: 'green',
    };
  }
  if (score >= 75) {
    return {
      level: 'GOOD',
      description: 'Strong compatibility with minor differences',
      color: 'blue',
    };
  }
  if (score >= 60) {
    return {
      level: 'MODERATE',
      description: 'Some alignment, may need communication about differences',
      color: 'yellow',
    };
  }
  if (score >= 40) {
    return {
      level: 'LOW',
      description: 'Different approaches, requires discussion',
      color: 'orange',
    };
  }
  return {
    level: 'MINIMAL',
    description: 'Significantly different working styles',
    color: 'red',
  };
};

/**
 * Get working style summary based on responses
 * @returns {Object} Working style profile
 */
scenarioResponseSchema.methods.getWorkingStyleProfile = function () {
  const profile = {
    crisisResponse: '',
    conflictStyle: '',
    managementApproach: '',
    financialMindset: '',
    competitiveStrategy: '',
    negotiationStyle: '',
  };

  // Crisis Response (Scenario 1)
  const crisisStyles = {
    A: 'Action-oriented, immediate response',
    B: 'Measured, prioritizes clear thinking',
    C: 'Collaborative, team-based approach',
    D: 'Quality-focused, avoids compromises',
  };
  profile.crisisResponse = crisisStyles[this.scenario1];

  // Conflict Style (Scenario 2)
  const conflictStyles = {
    A: 'Expertise-driven decisions',
    B: 'Data-driven, experimental',
    C: 'Seeks external perspective',
    D: 'Decisive with alignment focus',
  };
  profile.conflictStyle = conflictStyles[this.scenario2];

  // Management Approach (Scenario 3)
  const managementStyles = {
    A: 'Direct, structured feedback',
    B: 'Decisive, quick decisions',
    C: 'Adaptive, finds right fit',
    D: 'Patient, long-term view',
  };
  profile.managementApproach = managementStyles[this.scenario3];

  // Financial Mindset (Scenario 4)
  const financialStyles = {
    A: 'Conservative, capital preservation',
    B: 'Growth-focused, risk-tolerant',
    C: 'External funding oriented',
    D: 'Revenue-creative, bootstrapper',
  };
  profile.financialMindset = financialStyles[this.scenario4];

  // Competitive Strategy (Scenario 5)
  const competitiveStyles = {
    A: 'Execution-focused, ship fast',
    B: 'Differentiation-focused',
    C: 'Customer-obsessed, ignores noise',
    D: 'Strategic, learns from others',
  };
  profile.competitiveStrategy = competitiveStyles[this.scenario5];

  // Negotiation Style (Scenario 6)
  const negotiationStyles = {
    A: 'Relationship-oriented compromiser',
    B: 'Principled, holds position',
    C: 'Performance-based, structured',
    D: 'Understanding-first approach',
  };
  profile.negotiationStyle = negotiationStyles[this.scenario6];

  return profile;
};

/**
 * Get data safe for display (without sensitive info)
 * @returns {Object} Safe scenario data
 */
scenarioResponseSchema.methods.getPublicData = function () {
  return {
    id: this._id,
    completedAt: this.completedAt,
    canRetake: this.canRetake,
    daysUntilRetake: this.daysUntilRetake,
    workingStyleProfile: this.getWorkingStyleProfile(),
  };
};

/**
 * Get full data for owner
 * @returns {Object} Complete scenario data
 */
scenarioResponseSchema.methods.getOwnerData = function () {
  return {
    id: this._id,
    responses: this.responses,
    completedAt: this.completedAt,
    retakeCount: this.retakeCount,
    lastRetakeAt: this.lastRetakeAt,
    canRetake: this.canRetake,
    daysUntilRetake: this.daysUntilRetake,
    workingStyleProfile: this.getWorkingStyleProfile(),
  };
};

/**
 * Update responses (for retake)
 * @param {Object} newResponses - New scenario responses
 * @returns {Promise<ScenarioResponse>}
 */
scenarioResponseSchema.methods.retake = async function (newResponses) {
  if (!this.canRetake) {
    throw new Error(`Cannot retake for ${this.daysUntilRetake} more days`);
  }

  this.scenario1 = newResponses.scenario1;
  this.scenario2 = newResponses.scenario2;
  this.scenario3 = newResponses.scenario3;
  this.scenario4 = newResponses.scenario4;
  this.scenario5 = newResponses.scenario5;
  this.scenario6 = newResponses.scenario6;
  this.retakeCount += 1;
  this.lastRetakeAt = new Date();
  
  if (newResponses.completionTime) {
    this.completionTime = newResponses.completionTime;
  }

  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get scenario definitions (for frontend)
 * @returns {Object} All scenario definitions
 */
scenarioResponseSchema.statics.getScenarioDefinitions = function () {
  return SCENARIOS;
};

/**
 * Find responses by user ID
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<ScenarioResponse|null>}
 */
scenarioResponseSchema.statics.findByUserId = function (userId) {
  return this.findOne({ user: userId });
};

/**
 * Check if user has completed scenarios
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<boolean>}
 */
scenarioResponseSchema.statics.hasCompleted = async function (userId) {
  const count = await this.countDocuments({ user: userId });
  return count > 0;
};

/**
 * Create or update scenario responses
 * @param {ObjectId} userId - User's ID
 * @param {Object} responses - Scenario responses
 * @returns {Promise<ScenarioResponse>}
 */
scenarioResponseSchema.statics.createOrUpdate = async function (userId, responses) {
  const existing = await this.findByUserId(userId);
  
  if (existing) {
    return existing.retake(responses);
  }

  return this.create({
    user: userId,
    ...responses,
  });
};

/**
 * Calculate compatibility between two users
 * @param {ObjectId} userId1 - First user's ID
 * @param {ObjectId} userId2 - Second user's ID
 * @returns {Promise<Object|null>} Compatibility result or null if either hasn't completed
 */
scenarioResponseSchema.statics.calculateUserCompatibility = async function (userId1, userId2) {
  const [responses1, responses2] = await Promise.all([
    this.findByUserId(userId1),
    this.findByUserId(userId2),
  ]);

  if (!responses1 || !responses2) {
    return null;
  }

  return responses1.calculateCompatibility(responses2);
};

/**
 * Get completion statistics
 * @returns {Promise<Object>} Statistics
 */
scenarioResponseSchema.statics.getStatistics = async function () {
  const total = await this.countDocuments();
  
  const responseDistribution = await this.aggregate([
    {
      $group: {
        _id: null,
        scenario1_A: { $sum: { $cond: [{ $eq: ['$scenario1', 'A'] }, 1, 0] } },
        scenario1_B: { $sum: { $cond: [{ $eq: ['$scenario1', 'B'] }, 1, 0] } },
        scenario1_C: { $sum: { $cond: [{ $eq: ['$scenario1', 'C'] }, 1, 0] } },
        scenario1_D: { $sum: { $cond: [{ $eq: ['$scenario1', 'D'] }, 1, 0] } },
        // Add more scenarios as needed
      },
    },
  ]);

  const avgCompletionTime = await this.aggregate([
    { $match: { completionTime: { $ne: null } } },
    { $group: { _id: null, avgTime: { $avg: '$completionTime' } } },
  ]);

  return {
    totalCompletions: total,
    avgCompletionTimeSeconds: avgCompletionTime[0]?.avgTime || null,
    responseDistribution: responseDistribution[0] || {},
  };
};

// ============================================
// MODEL EXPORT
// ============================================

const ScenarioResponse = mongoose.model('ScenarioResponse', scenarioResponseSchema);

// Also export scenario definitions for use elsewhere
ScenarioResponse.SCENARIOS = SCENARIOS;

module.exports = ScenarioResponse;
