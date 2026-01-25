/**
 * @fileoverview Team Member Model
 *
 * Tracks team members for founders:
 * - Auto-added from matched candidates
 * - Manually added previous hires/co-founders
 * - Team roster management
 *
 * @module models/TeamMember
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ============================================
// TEAM MEMBER STATUS
// ============================================

const TEAM_MEMBER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',           // Currently on the team
  PENDING: 'PENDING',         // Match accepted, onboarding
  INACTIVE: 'INACTIVE',       // Left the team
  TRIAL: 'TRIAL',             // In trial period
});

// ============================================
// TEAM MEMBER SOURCE
// ============================================

const TEAM_MEMBER_SOURCE = Object.freeze({
  MATCHED: 'MATCHED',         // Auto-added from matched interest
  MANUAL: 'MANUAL',           // Manually added by founder
  CONNECTION: 'CONNECTION',   // Added from connection request
  IMPORTED: 'IMPORTED',       // Imported from external source
});

// ============================================
// SCHEMA DEFINITION
// ============================================

const teamMemberSchema = new Schema(
  {
    // ==========================================
    // OWNER (FOUNDER)
    // ==========================================

    /**
     * The founder who owns this team roster
     */
    founder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /**
     * The founder's profile
     */
    founderProfile: {
      type: Schema.Types.ObjectId,
      ref: 'FounderProfile',
    },

    // ==========================================
    // TEAM MEMBER INFO
    // ==========================================

    /**
     * Reference to User (if the team member is a platform user)
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    /**
     * Reference to BuilderProfile (if applicable)
     */
    builderProfile: {
      type: Schema.Types.ObjectId,
      ref: 'BuilderProfile',
      default: null,
    },

    /**
     * Name (for manually added members without platform account)
     */
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    /**
     * Email (for non-platform members)
     */
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    /**
     * Profile photo URL (for non-platform members)
     */
    profilePhoto: {
      type: String,
      trim: true,
    },

    // ==========================================
    // ROLE & POSITION
    // ==========================================

    /**
     * Role/position on the team
     */
    role: {
      type: String,
      trim: true,
      maxlength: [100, 'Role cannot exceed 100 characters'],
    },

    /**
     * Type of role
     */
    roleType: {
      type: String,
      enum: ['COFOUNDER', 'EMPLOYEE', 'CONTRACTOR', 'ADVISOR', 'INTERN', 'OTHER'],
      default: 'EMPLOYEE',
    },

    /**
     * Department/function
     */
    department: {
      type: String,
      enum: ['ENGINEERING', 'DESIGN', 'PRODUCT', 'MARKETING', 'SALES', 'OPERATIONS', 'FINANCE', 'OTHER'],
      default: 'ENGINEERING',
    },

    /**
     * Skills they bring to the team
     */
    skills: {
      type: [String],
      default: [],
    },

    // ==========================================
    // STATUS & DATES
    // ==========================================

    /**
     * Current status
     */
    status: {
      type: String,
      enum: Object.values(TEAM_MEMBER_STATUS),
      default: TEAM_MEMBER_STATUS.ACTIVE,
      index: true,
    },

    /**
     * Date joined the team
     */
    joinedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * Date left the team (if inactive)
     */
    leftAt: {
      type: Date,
      default: null,
    },

    /**
     * Trial end date (if in trial)
     */
    trialEndDate: {
      type: Date,
      default: null,
    },

    // ==========================================
    // SOURCE & REFERENCES
    // ==========================================

    /**
     * How this member was added
     */
    source: {
      type: String,
      enum: Object.values(TEAM_MEMBER_SOURCE),
      default: TEAM_MEMBER_SOURCE.MANUAL,
    },

    /**
     * Reference to Interest (if matched)
     */
    interest: {
      type: Schema.Types.ObjectId,
      ref: 'Interest',
      default: null,
    },

    /**
     * Reference to Opening (if hired through opening)
     */
    opening: {
      type: Schema.Types.ObjectId,
      ref: 'Opening',
      default: null,
    },

    /**
     * Reference to ConnectionRequest (if from connection)
     */
    connectionRequest: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionRequest',
      default: null,
    },

    // ==========================================
    // COMPENSATION (OPTIONAL)
    // ==========================================

    /**
     * Equity percentage (if applicable)
     */
    equityPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    /**
     * Monthly compensation (if applicable)
     */
    monthlyCompensation: {
      type: Number,
      min: 0,
      default: null,
    },

    /**
     * Currency
     */
    currency: {
      type: String,
      enum: ['INR', 'USD', 'AED', 'EUR', 'GBP'],
      default: 'INR',
    },

    // ==========================================
    // NOTES & METADATA
    // ==========================================

    /**
     * Notes about this team member
     */
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    /**
     * LinkedIn profile URL
     */
    linkedinUrl: {
      type: String,
      trim: true,
    },

    /**
     * Additional metadata
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES
// ============================================

// Compound index for founder's team
teamMemberSchema.index({ founder: 1, status: 1 });
teamMemberSchema.index({ founder: 1, roleType: 1 });
teamMemberSchema.index({ founder: 1, user: 1 }, { unique: true, sparse: true });

// ============================================
// VIRTUALS
// ============================================

/**
 * Check if team member is active
 */
teamMemberSchema.virtual('isActive').get(function() {
  return this.status === TEAM_MEMBER_STATUS.ACTIVE;
});

/**
 * Check if team member is on trial
 */
teamMemberSchema.virtual('isOnTrial').get(function() {
  return this.status === TEAM_MEMBER_STATUS.TRIAL;
});

/**
 * Get display name (from user or manual name)
 */
teamMemberSchema.virtual('displayName').get(function() {
  if (this.user && this.user.name) {
    return this.user.name;
  }
  return this.name || 'Unknown';
});

/**
 * Get display photo (from user or manual photo)
 */
teamMemberSchema.virtual('displayPhoto').get(function() {
  if (this.user && this.user.profilePhoto) {
    return this.user.profilePhoto;
  }
  return this.profilePhoto || null;
});

/**
 * Days on team
 */
teamMemberSchema.virtual('daysOnTeam').get(function() {
  const endDate = this.leftAt || new Date();
  return Math.floor((endDate - this.joinedAt) / (1000 * 60 * 60 * 24));
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark member as active
 */
teamMemberSchema.methods.activate = async function() {
  this.status = TEAM_MEMBER_STATUS.ACTIVE;
  if (!this.joinedAt) {
    this.joinedAt = new Date();
  }
  return this.save();
};

/**
 * Mark member as inactive (left)
 */
teamMemberSchema.methods.deactivate = async function() {
  this.status = TEAM_MEMBER_STATUS.INACTIVE;
  this.leftAt = new Date();
  return this.save();
};

/**
 * Start trial period
 */
teamMemberSchema.methods.startTrial = async function(endDate) {
  this.status = TEAM_MEMBER_STATUS.TRIAL;
  this.trialEndDate = endDate;
  return this.save();
};

/**
 * Update role
 */
teamMemberSchema.methods.updateRole = async function(role, roleType) {
  this.role = role;
  if (roleType) {
    this.roleType = roleType;
  }
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get team for a founder
 */
teamMemberSchema.statics.getTeam = function(founderId, options = {}) {
  const { status, roleType, page = 1, limit = 50 } = options;

  const query = { founder: founderId };
  if (status) {
    query.status = status;
  }
  if (roleType) {
    query.roleType = roleType;
  }

  return this.find(query)
    .populate('user', 'name profilePhoto email phone activeRole')
    .populate('builderProfile', 'headline skills')
    .populate('opening', 'title roleType')
    .sort({ joinedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

/**
 * Get team count by status
 */
teamMemberSchema.statics.getTeamCountByStatus = async function(founderId) {
  const results = await this.aggregate([
    { $match: { founder: new mongoose.Types.ObjectId(founderId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return results.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Get team count by role type
 */
teamMemberSchema.statics.getTeamCountByRoleType = async function(founderId) {
  const results = await this.aggregate([
    {
      $match: {
        founder: new mongoose.Types.ObjectId(founderId),
        status: TEAM_MEMBER_STATUS.ACTIVE,
      }
    },
    { $group: { _id: '$roleType', count: { $sum: 1 } } },
  ]);

  return results.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

/**
 * Check if user is already on founder's team
 */
teamMemberSchema.statics.isOnTeam = async function(founderId, userId) {
  const member = await this.findOne({
    founder: founderId,
    user: userId,
    status: { $in: [TEAM_MEMBER_STATUS.ACTIVE, TEAM_MEMBER_STATUS.PENDING, TEAM_MEMBER_STATUS.TRIAL] },
  });
  return !!member;
};

/**
 * Add member from matched interest
 */
teamMemberSchema.statics.addFromMatch = async function(founderId, interest, builderProfile) {
  // Check if already on team
  const existing = await this.findOne({
    founder: founderId,
    user: interest.builder,
  });

  if (existing) {
    // Reactivate if inactive
    if (existing.status === TEAM_MEMBER_STATUS.INACTIVE) {
      existing.status = TEAM_MEMBER_STATUS.ACTIVE;
      existing.leftAt = null;
      existing.interest = interest._id;
      existing.opening = interest.opening;
      return existing.save();
    }
    return existing;
  }

  // Get opening details for role info
  const Opening = mongoose.model('Opening');
  const opening = await Opening.findById(interest.opening);

  return this.create({
    founder: founderId,
    user: interest.builder,
    builderProfile: interest.builderProfile,
    role: opening?.title || 'Team Member',
    roleType: opening?.roleType || 'EMPLOYEE',
    department: opening?.department || 'ENGINEERING',
    skills: builderProfile?.skills || [],
    status: TEAM_MEMBER_STATUS.ACTIVE,
    source: TEAM_MEMBER_SOURCE.MATCHED,
    interest: interest._id,
    opening: interest.opening,
    joinedAt: new Date(),
  });
};

/**
 * Get team summary for founder
 */
teamMemberSchema.statics.getTeamSummary = async function(founderId) {
  const [countByStatus, countByRole, totalActive] = await Promise.all([
    this.getTeamCountByStatus(founderId),
    this.getTeamCountByRoleType(founderId),
    this.countDocuments({
      founder: founderId,
      status: TEAM_MEMBER_STATUS.ACTIVE
    }),
  ]);

  return {
    total: totalActive,
    byStatus: countByStatus,
    byRoleType: countByRole,
  };
};

// ============================================
// MODEL EXPORT
// ============================================

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = {
  TeamMember,
  TEAM_MEMBER_STATUS,
  TEAM_MEMBER_SOURCE,
};
