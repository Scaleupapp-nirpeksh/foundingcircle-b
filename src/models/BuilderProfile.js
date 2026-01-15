/**
 * @fileoverview BuilderProfile model - Detailed builder/talent information
 * 
 * Stores:
 * - Skills and portfolio
 * - Risk appetite
 * - Compensation openness
 * - Availability and commitment
 * - Intent statement
 * - Experience background
 * 
 * @module models/BuilderProfile
 */

const mongoose = require('mongoose');
const {
  RISK_APPETITES,
  COMPENSATION_TYPES,
  DURATION_PREFERENCES,
  REMOTE_PREFERENCES,
  ROLE_TYPES,
} = require('../constants');

const { Schema } = mongoose;

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Portfolio link sub-schema
 */
const portfolioLinkSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['GITHUB', 'LINKEDIN', 'BEHANCE', 'DRIBBBLE', 'FIGMA', 'NOTION', 'WEBSITE', 'OTHER'],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Link title cannot exceed 100 characters'],
    },
  },
  { _id: false }
);

/**
 * Work experience sub-schema
 */
const experienceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null, // null means current
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

/**
 * Education sub-schema
 */
const educationSchema = new Schema(
  {
    institution: {
      type: String,
      required: true,
      trim: true,
      maxlength: [150, 'Institution name cannot exceed 150 characters'],
    },
    degree: {
      type: String,
      trim: true,
      maxlength: [100, 'Degree cannot exceed 100 characters'],
    },
    field: {
      type: String,
      trim: true,
      maxlength: [100, 'Field cannot exceed 100 characters'],
    },
    graduationYear: {
      type: Number,
      min: 1950,
      max: 2100,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Social links sub-schema
 */
const socialLinksSchema = new Schema(
  {
    linkedin: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i,
        'Please provide a valid LinkedIn URL',
      ],
    },
    twitter: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.*$/i,
        'Please provide a valid Twitter/X URL',
      ],
    },
    github: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?github\.com\/.*$/i,
        'Please provide a valid GitHub URL',
      ],
    },
    website: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMA
// ============================================

const builderProfileSchema = new Schema(
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
    // BASIC INFO
    // ==========================================

    /**
     * Display name (can differ from User.name)
     */
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },

    /**
     * Professional headline
     */
    headline: {
      type: String,
      trim: true,
      maxlength: [150, 'Headline cannot exceed 150 characters'],
    },

    /**
     * Bio/About section
     */
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },

    // ==========================================
    // SKILLS
    // ==========================================

    /**
     * Primary skills (from predefined list + custom)
     */
    skills: {
      type: [String],
      required: [true, 'At least 2 skills are required'],
      validate: {
        validator: function (v) {
          return v.length >= 2 && v.length <= 20;
        },
        message: 'Please select between 2 and 20 skills',
      },
      index: true,
    },

    /**
     * Primary/strongest skills (subset of skills)
     */
    primarySkills: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 primary skills allowed',
      },
    },

    /**
     * Years of experience per skill (optional)
     */
    skillExperience: {
      type: Map,
      of: Number,
      default: new Map(),
    },

    /**
     * Total years of professional experience
     */
    yearsOfExperience: {
      type: Number,
      min: [0, 'Years of experience cannot be negative'],
      max: [50, 'Years of experience cannot exceed 50'],
      default: 0,
    },

    /**
     * Experience level
     */
    experienceLevel: {
      type: String,
      enum: ['STUDENT', 'ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'],
      default: 'ENTRY',
    },

    // ==========================================
    // RISK APPETITE
    // ==========================================

    /**
     * Risk appetite level
     * LOW: Prefers stable income, lower risk
     * MEDIUM: Open to some risk with safety net
     * HIGH: Comfortable with high uncertainty
     */
    riskAppetite: {
      type: String,
      enum: {
        values: Object.values(RISK_APPETITES),
        message: 'Invalid risk appetite level',
      },
      required: [true, 'Risk appetite is required'],
      index: true,
    },

    /**
     * Additional risk context
     */
    riskContext: {
      type: String,
      trim: true,
      maxlength: [300, 'Risk context cannot exceed 300 characters'],
    },

    // ==========================================
    // COMPENSATION OPENNESS
    // ==========================================

    /**
     * Types of compensation the builder is open to
     */
    compensationOpenness: {
      type: [{
        type: String,
        enum: {
          values: Object.values(COMPENSATION_TYPES),
          message: 'Invalid compensation type',
        },
      }],
      required: [true, 'At least one compensation preference is required'],
      validate: {
        validator: function (v) {
          return v.length > 0 && v.length <= 4;
        },
        message: 'Select between 1 and 4 compensation preferences',
      },
    },

    /**
     * Minimum expected monthly cash (if applicable)
     * 0 means open to equity-only
     */
    minimumCash: {
      type: Number,
      default: 0,
      min: [0, 'Minimum cash cannot be negative'],
    },

    /**
     * Expected monthly cash range (if seeking paid role)
     */
    expectedCashRange: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },

    /**
     * Currency preference
     */
    preferredCurrency: {
      type: String,
      enum: ['INR', 'AED', 'USD'],
      default: 'INR',
    },

    // ==========================================
    // AVAILABILITY
    // ==========================================

    /**
     * Hours available per week
     */
    hoursPerWeek: {
      type: Number,
      required: [true, 'Hours per week is required'],
      min: [5, 'Minimum 5 hours per week'],
      max: [80, 'Maximum 80 hours per week'],
    },

    /**
     * Duration preference
     */
    durationPreference: {
      type: String,
      enum: {
        values: Object.values(DURATION_PREFERENCES),
        message: 'Invalid duration preference',
      },
      required: [true, 'Duration preference is required'],
    },

    /**
     * Earliest start date
     */
    availableFrom: {
      type: Date,
      default: Date.now,
    },

    /**
     * Currently available or has notice period
     */
    availabilityStatus: {
      type: String,
      enum: ['IMMEDIATELY', 'WITHIN_2_WEEKS', 'WITHIN_MONTH', 'WITHIN_3_MONTHS', 'NOT_LOOKING'],
      default: 'IMMEDIATELY',
    },

    /**
     * Current employment status
     */
    currentStatus: {
      type: String,
      enum: ['EMPLOYED', 'FREELANCING', 'STUDENT', 'BETWEEN_JOBS', 'ENTREPRENEUR', 'OTHER'],
      default: 'OTHER',
    },

    // ==========================================
    // ROLE PREFERENCES
    // ==========================================

    /**
     * Types of roles interested in
     */
    rolesInterested: {
      type: [{
        type: String,
        enum: {
          values: Object.values(ROLE_TYPES),
          message: 'Invalid role type',
        },
      }],
      default: [ROLE_TYPES.EMPLOYEE],
      validate: {
        validator: function (v) {
          return v.length > 0 && v.length <= 4;
        },
        message: 'Select between 1 and 4 role types',
      },
    },

    /**
     * Preferred startup stages
     */
    preferredStages: {
      type: [String],
      default: [],
    },

    /**
     * Preferred industries/domains
     */
    preferredIndustries: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 preferred industries',
      },
    },

    // ==========================================
    // INTENT STATEMENT
    // ==========================================

    /**
     * Why do you want to build with an early-stage startup?
     * Key matching field
     */
    intentStatement: {
      type: String,
      trim: true,
      required: [true, 'Intent statement is required'],
      minlength: [50, 'Intent statement must be at least 50 characters'],
      maxlength: [300, 'Intent statement cannot exceed 300 characters'],
    },

    // ==========================================
    // LOCATION & PREFERENCES
    // ==========================================

    /**
     * Current location
     */
    location: {
      city: {
        type: String,
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters'],
      },
      country: {
        type: String,
        trim: true,
        maxlength: [100, 'Country cannot exceed 100 characters'],
      },
      timezone: {
        type: String,
        trim: true,
      },
    },

    /**
     * Remote work preference
     */
    remotePreference: {
      type: String,
      enum: {
        values: Object.values(REMOTE_PREFERENCES),
        message: 'Invalid remote preference',
      },
      required: [true, 'Remote preference is required'],
    },

    /**
     * Open to relocating
     */
    openToRelocation: {
      type: Boolean,
      default: false,
    },

    /**
     * Preferred work locations (if not fully remote)
     */
    preferredLocations: {
      type: [String],
      default: [],
    },

    // ==========================================
    // PORTFOLIO & LINKS
    // ==========================================

    /**
     * Portfolio links
     */
    portfolioLinks: {
      type: [portfolioLinkSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'Maximum 10 portfolio links allowed',
      },
    },

    /**
     * Social media links
     */
    socialLinks: {
      type: socialLinksSchema,
      default: {},
    },

    // ==========================================
    // EXPERIENCE & EDUCATION
    // ==========================================

    /**
     * Work experience history
     */
    experience: {
      type: [experienceSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'Maximum 10 experience entries allowed',
      },
    },

    /**
     * Education history
     */
    education: {
      type: [educationSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 education entries allowed',
      },
    },

    // ==========================================
    // ACHIEVEMENTS & HIGHLIGHTS
    // ==========================================

    /**
     * Notable achievements or highlights
     */
    achievements: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 achievements allowed',
      },
    },

    /**
     * Languages spoken
     */
    languages: {
      type: [String],
      default: ['English'],
    },

    // ==========================================
    // PROFILE STATUS
    // ==========================================

    /**
     * Whether the profile is complete
     */
    isComplete: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Profile completion percentage
     */
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /**
     * Whether profile is visible in discovery
     */
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * Currently open to opportunities
     */
    isOpenToOpportunities: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * Admin verification status
     */
    isVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Verification date
     */
    verifiedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // ANALYTICS
    // ==========================================

    /**
     * Number of profile views
     */
    viewCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of interests expressed
     */
    interestSentCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of shortlists received
     */
    shortlistCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of matches
     */
    matchCount: {
      type: Number,
      default: 0,
    },

    /**
     * Last active date for this profile
     */
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // METADATA
    // ==========================================

    /**
     * Additional metadata
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

// Compound indexes for discovery queries
builderProfileSchema.index({ isComplete: 1, isVisible: 1, isOpenToOpportunities: 1 });
builderProfileSchema.index({ skills: 1, isVisible: 1 });
builderProfileSchema.index({ riskAppetite: 1, isVisible: 1 });
builderProfileSchema.index({ rolesInterested: 1, isVisible: 1 });
builderProfileSchema.index({ compensationOpenness: 1 });
builderProfileSchema.index({ 'location.city': 1, 'location.country': 1 });
builderProfileSchema.index({ remotePreference: 1 });
builderProfileSchema.index({ hoursPerWeek: 1 });
builderProfileSchema.index({ createdAt: -1 });
builderProfileSchema.index({ lastActiveAt: -1 });

// Text index for search
builderProfileSchema.index({
  displayName: 'text',
  headline: 'text',
  bio: 'text',
  intentStatement: 'text',
  skills: 'text',
});

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if builder is open to equity-only opportunities
 */
builderProfileSchema.virtual('acceptsEquityOnly').get(function () {
  return this.compensationOpenness?.includes(COMPENSATION_TYPES.EQUITY_ONLY);
});

/**
 * Check if builder is looking for co-founder roles
 */
builderProfileSchema.virtual('seekingCofounderRole').get(function () {
  return this.rolesInterested?.includes(ROLE_TYPES.COFOUNDER);
});

/**
 * Check if builder has high availability (30+ hours)
 */
builderProfileSchema.virtual('highAvailability').get(function () {
  return this.hoursPerWeek >= 30;
});

/**
 * Get availability description
 */
builderProfileSchema.virtual('availabilityDescription').get(function () {
  if (this.hoursPerWeek >= 40) return 'Full-time';
  if (this.hoursPerWeek >= 30) return 'Part-time+';
  if (this.hoursPerWeek >= 20) return 'Part-time';
  if (this.hoursPerWeek >= 10) return 'Limited';
  return 'Minimal';
});

/**
 * Get risk appetite description
 */
builderProfileSchema.virtual('riskDescription').get(function () {
  const descriptions = {
    [RISK_APPETITES.HIGH]: 'Comfortable with high uncertainty, equity-focused',
    [RISK_APPETITES.MEDIUM]: 'Balanced approach, some stability needed',
    [RISK_APPETITES.LOW]: 'Prefers stability, lower risk tolerance',
  };
  return descriptions[this.riskAppetite] || 'Not specified';
});

/**
 * Get years since graduation (if education provided)
 */
builderProfileSchema.virtual('yearsSinceGraduation').get(function () {
  if (!this.education || this.education.length === 0) return null;
  
  const latestEducation = this.education
    .filter(e => e.graduationYear && !e.isCurrent)
    .sort((a, b) => b.graduationYear - a.graduationYear)[0];
  
  if (!latestEducation) return null;
  return new Date().getFullYear() - latestEducation.graduationYear;
});

/**
 * Check if currently employed
 */
builderProfileSchema.virtual('isCurrentlyEmployed').get(function () {
  return this.experience?.some(e => e.isCurrent);
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Calculate profile completion percentage before save
 */
builderProfileSchema.pre('save', function (next) {
  this.completionPercentage = this.calculateCompletion();
  this.isComplete = this.completionPercentage === 100;
  next();
});

/**
 * Update lastActiveAt on save
 */
builderProfileSchema.pre('save', function (next) {
  this.lastActiveAt = new Date();
  next();
});

/**
 * Ensure primary skills are subset of skills
 */
builderProfileSchema.pre('save', function (next) {
  if (this.primarySkills && this.skills) {
    this.primarySkills = this.primarySkills.filter(skill => 
      this.skills.includes(skill)
    );
  }
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Calculate profile completion percentage
 * @returns {number} Completion percentage (0-100)
 */
builderProfileSchema.methods.calculateCompletion = function () {
  const fields = {
    // Required fields (points totaling 100)
    skills: 15,
    riskAppetite: 15,
    compensationOpenness: 15,
    hoursPerWeek: 10,
    durationPreference: 10,
    intentStatement: 15,
    remotePreference: 10,
    rolesInterested: 10,
  };

  let score = 0;

  // Check each field
  if (this.skills?.length >= 2) score += fields.skills;
  if (this.riskAppetite) score += fields.riskAppetite;
  if (this.compensationOpenness?.length > 0) score += fields.compensationOpenness;
  if (this.hoursPerWeek >= 5) score += fields.hoursPerWeek;
  if (this.durationPreference) score += fields.durationPreference;
  if (this.intentStatement?.length >= 50) score += fields.intentStatement;
  if (this.remotePreference) score += fields.remotePreference;
  if (this.rolesInterested?.length > 0) score += fields.rolesInterested;

  return Math.min(100, score);
};

/**
 * Get data safe for public display
 * @returns {Object} Public profile data
 */
builderProfileSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    displayName: this.displayName,
    headline: this.headline,
    bio: this.bio,
    skills: this.skills,
    primarySkills: this.primarySkills,
    yearsOfExperience: this.yearsOfExperience,
    experienceLevel: this.experienceLevel,
    riskAppetite: this.riskAppetite,
    riskDescription: this.riskDescription,
    compensationOpenness: this.compensationOpenness,
    acceptsEquityOnly: this.acceptsEquityOnly,
    hoursPerWeek: this.hoursPerWeek,
    availabilityDescription: this.availabilityDescription,
    durationPreference: this.durationPreference,
    availabilityStatus: this.availabilityStatus,
    rolesInterested: this.rolesInterested,
    intentStatement: this.intentStatement,
    location: this.location,
    remotePreference: this.remotePreference,
    openToRelocation: this.openToRelocation,
    portfolioLinks: this.portfolioLinks,
    socialLinks: this.socialLinks,
    achievements: this.achievements,
    languages: this.languages,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

/**
 * Get matching data (used by matching algorithm)
 * @returns {Object} Data for matching
 */
builderProfileSchema.methods.getMatchingData = function () {
  return {
    id: this._id,
    userId: this.user,
    skills: this.skills,
    riskAppetite: this.riskAppetite,
    compensationOpenness: this.compensationOpenness,
    minimumCash: this.minimumCash,
    hoursPerWeek: this.hoursPerWeek,
    durationPreference: this.durationPreference,
    rolesInterested: this.rolesInterested,
    preferredStages: this.preferredStages,
    remotePreference: this.remotePreference,
    location: this.location,
  };
};

/**
 * Check if builder matches a founder's requirements
 * @param {Object} founderRequirements - Founder's requirements
 * @returns {Object} Match result with score and details
 */
builderProfileSchema.methods.checkCompatibility = function (founderRequirements) {
  const result = {
    isCompatible: true,
    score: 0,
    details: {},
  };

  // Check role type compatibility
  const roleMatch = founderRequirements.rolesSeeking?.some(role =>
    this.rolesInterested.includes(role)
  );
  if (!roleMatch) {
    result.isCompatible = false;
    result.details.role = 'No matching role types';
  }

  // Check skill match
  const matchedSkills = this.skills.filter(skill =>
    founderRequirements.skillsNeeded?.includes(skill)
  );
  result.details.skillMatch = {
    matched: matchedSkills.length,
    total: founderRequirements.skillsNeeded?.length || 0,
    percentage: founderRequirements.skillsNeeded?.length
      ? Math.round((matchedSkills.length / founderRequirements.skillsNeeded.length) * 100)
      : 0,
  };

  // Check compensation compatibility
  const founderOffersEquityOnly = 
    founderRequirements.cashRange?.min === 0 && 
    founderRequirements.cashRange?.max === 0;
  
  if (founderOffersEquityOnly && !this.acceptsEquityOnly) {
    result.isCompatible = false;
    result.details.compensation = 'Builder requires cash compensation';
  }

  // Check hours compatibility
  if (this.hoursPerWeek < founderRequirements.hoursPerWeek * 0.5) {
    result.isCompatible = false;
    result.details.hours = 'Insufficient availability';
  }

  return result;
};

/**
 * Increment view count
 * @returns {Promise<void>}
 */
builderProfileSchema.methods.incrementViews = async function () {
  await this.updateOne({ $inc: { viewCount: 1 } });
};

/**
 * Increment interest sent count
 * @returns {Promise<void>}
 */
builderProfileSchema.methods.incrementInterestsSent = async function () {
  await this.updateOne({ $inc: { interestSentCount: 1 } });
};

/**
 * Increment shortlist count
 * @returns {Promise<void>}
 */
builderProfileSchema.methods.incrementShortlists = async function () {
  await this.updateOne({ $inc: { shortlistCount: 1 } });
};

/**
 * Increment match count
 * @returns {Promise<void>}
 */
builderProfileSchema.methods.incrementMatches = async function () {
  await this.updateOne({ $inc: { matchCount: 1 } });
};

/**
 * Update activity timestamp
 * @returns {Promise<void>}
 */
builderProfileSchema.methods.updateActivity = async function () {
  await this.updateOne({ $set: { lastActiveAt: new Date() } });
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find profile by user ID
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<BuilderProfile|null>}
 */
builderProfileSchema.statics.findByUserId = function (userId) {
  return this.findOne({ user: userId });
};

/**
 * Find complete and visible profiles for discovery
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options (pagination, sort)
 * @returns {Promise<BuilderProfile[]>}
 */
builderProfileSchema.statics.findForDiscovery = function (filters = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = { lastActiveAt: -1 },
  } = options;

  const query = {
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
    ...filters,
  };

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name profilePhoto isVerified');
};

/**
 * Find profiles by skills
 * @param {string[]} skills - Array of skills to match
 * @param {Object} options - Query options
 * @returns {Promise<BuilderProfile[]>}
 */
builderProfileSchema.statics.findBySkills = function (skills, options = {}) {
  const { matchAll = false, limit = 20 } = options;

  const query = {
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
  };

  if (matchAll) {
    query.skills = { $all: skills };
  } else {
    query.skills = { $in: skills };
  }

  return this.find(query)
    .limit(limit)
    .populate('user', 'name profilePhoto isVerified');
};

/**
 * Find profiles interested in specific role type
 * @param {string} roleType - Role type (COFOUNDER, EMPLOYEE, etc.)
 * @returns {Promise<BuilderProfile[]>}
 */
builderProfileSchema.statics.findByRoleInterest = function (roleType) {
  return this.find({
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
    rolesInterested: roleType,
  }).populate('user', 'name profilePhoto isVerified');
};

/**
 * Find profiles accepting equity-only compensation
 * @returns {Promise<BuilderProfile[]>}
 */
builderProfileSchema.statics.findEquityOpenBuilders = function () {
  return this.find({
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
    compensationOpenness: COMPENSATION_TYPES.EQUITY_ONLY,
  }).populate('user', 'name profilePhoto isVerified');
};

/**
 * Find profiles by risk appetite
 * @param {string} riskLevel - Risk appetite level
 * @returns {Promise<BuilderProfile[]>}
 */
builderProfileSchema.statics.findByRiskAppetite = function (riskLevel) {
  return this.find({
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
    riskAppetite: riskLevel,
  }).populate('user', 'name profilePhoto isVerified');
};

/**
 * Get active profile count by risk appetite
 * @returns {Promise<Object>} Count by risk level
 */
builderProfileSchema.statics.getCountByRiskAppetite = async function () {
  const result = await this.aggregate([
    {
      $match: {
        isComplete: true,
        isVisible: true,
        isOpenToOpportunities: true,
      },
    },
    { $group: { _id: '$riskAppetite', count: { $sum: 1 } } },
  ]);

  return result.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Search profiles by text
 * @param {string} searchText - Text to search
 * @param {number} limit - Max results
 * @returns {Promise<BuilderProfile[]>}
 */
builderProfileSchema.statics.searchProfiles = function (searchText, limit = 20) {
  return this.find(
    {
      isComplete: true,
      isVisible: true,
      isOpenToOpportunities: true,
      $text: { $search: searchText },
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('user', 'name profilePhoto isVerified');
};

/**
 * Get builders available for immediate start
 * @param {number} minHours - Minimum hours per week
 * @returns {Promise<BuilderProfile[]>}
 */
builderProfileSchema.statics.findImmediatelyAvailable = function (minHours = 20) {
  return this.find({
    isComplete: true,
    isVisible: true,
    isOpenToOpportunities: true,
    availabilityStatus: 'IMMEDIATELY',
    hoursPerWeek: { $gte: minHours },
  })
    .sort({ hoursPerWeek: -1 })
    .populate('user', 'name profilePhoto isVerified');
};

// ============================================
// MODEL EXPORT
// ============================================

const BuilderProfile = mongoose.model('BuilderProfile', builderProfileSchema);

module.exports = BuilderProfile;