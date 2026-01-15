/**
 * @fileoverview Swagger Schema Definitions
 *
 * OpenAPI 3.0 schema definitions for all models and common types.
 *
 * @module docs/schemas
 */

// ============================================
// COMMON SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Operation successful
 *         data:
 *           type: object
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Error message
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: VALIDATION_ERROR
 *             details:
 *               type: array
 *               items:
 *                 type: object
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 100
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         pages:
 *           type: integer
 *           example: 10
 *         hasMore:
 *           type: boolean
 *           example: true
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *             pagination:
 *               $ref: '#/components/schemas/PaginationMeta'
 */

// ============================================
// USER SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         name:
 *           type: string
 *           example: John Doe
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         userType:
 *           type: string
 *           enum: [founder, builder]
 *           example: founder
 *         activeRole:
 *           type: string
 *           enum: [founder, builder]
 *           example: founder
 *         status:
 *           type: string
 *           enum: [active, suspended, banned, deleted]
 *           example: active
 *         isAdmin:
 *           type: boolean
 *           example: false
 *         isVerified:
 *           type: boolean
 *           example: true
 *         onboardingComplete:
 *           type: boolean
 *           example: true
 *         avatarUrl:
 *           type: string
 *           example: https://s3.amazonaws.com/bucket/avatar.jpg
 *         location:
 *           type: string
 *           example: Mumbai, India
 *         timezone:
 *           type: string
 *           example: Asia/Kolkata
 *         hasFounderProfile:
 *           type: boolean
 *           example: true
 *         hasBuilderProfile:
 *           type: boolean
 *           example: false
 *         subscription:
 *           type: object
 *           properties:
 *             tier:
 *               type: string
 *               enum: [free, pro, boost]
 *               example: free
 *             expiresAt:
 *               type: string
 *               format: date-time
 *         lastActive:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         location:
 *           type: string
 *           example: Mumbai, India
 *         avatarUrl:
 *           type: string
 *           example: https://s3.amazonaws.com/bucket/avatar.jpg
 *         timezone:
 *           type: string
 *           example: Asia/Kolkata
 */

// ============================================
// FOUNDER PROFILE SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     FounderProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         headline:
 *           type: string
 *           example: Building the future of fintech
 *         bio:
 *           type: string
 *           example: Serial entrepreneur with 10+ years experience
 *         startupName:
 *           type: string
 *           example: TechStartup Inc.
 *         startupDescription:
 *           type: string
 *           example: We are building a revolutionary fintech platform
 *         startupStage:
 *           type: string
 *           enum: [idea, mvp, early_revenue, scaling, funded]
 *           example: mvp
 *         industry:
 *           type: string
 *           example: Fintech
 *         website:
 *           type: string
 *           format: uri
 *           example: https://techstartup.com
 *         linkedinUrl:
 *           type: string
 *           format: uri
 *           example: https://linkedin.com/in/founder
 *         pitchDeckUrl:
 *           type: string
 *           format: uri
 *           example: https://s3.amazonaws.com/bucket/pitch.pdf
 *         fundingStatus:
 *           type: string
 *           enum: [bootstrapped, pre_seed, seed, series_a, series_b_plus]
 *           example: bootstrapped
 *         teamSize:
 *           type: integer
 *           example: 3
 *         rolesSeeking:
 *           type: array
 *           items:
 *             type: string
 *             enum: [tech_cofounder, cto, lead_engineer, full_stack_dev, frontend_dev, backend_dev, mobile_dev, devops, designer, product_manager, growth_marketer, sales, operations]
 *           example: [cto, lead_engineer]
 *         equityRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               example: 1
 *             max:
 *               type: number
 *               example: 5
 *         cashRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               example: 50000
 *             max:
 *               type: number
 *               example: 100000
 *         profileCompleteness:
 *           type: integer
 *           example: 85
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     FounderProfileInput:
 *       type: object
 *       properties:
 *         headline:
 *           type: string
 *         bio:
 *           type: string
 *         startupName:
 *           type: string
 *         startupDescription:
 *           type: string
 *         startupStage:
 *           type: string
 *           enum: [idea, mvp, early_revenue, scaling, funded]
 *         industry:
 *           type: string
 *         website:
 *           type: string
 *         linkedinUrl:
 *           type: string
 *         fundingStatus:
 *           type: string
 *           enum: [bootstrapped, pre_seed, seed, series_a, series_b_plus]
 *         teamSize:
 *           type: integer
 *         rolesSeeking:
 *           type: array
 *           items:
 *             type: string
 *         equityRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         cashRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 */

// ============================================
// BUILDER PROFILE SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     BuilderProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         headline:
 *           type: string
 *           example: Full-stack developer passionate about startups
 *         bio:
 *           type: string
 *           example: 5 years experience building scalable applications
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: [JavaScript, React, Node.js, MongoDB]
 *         yearsOfExperience:
 *           type: integer
 *           example: 5
 *         portfolioUrl:
 *           type: string
 *           format: uri
 *           example: https://portfolio.dev
 *         githubUrl:
 *           type: string
 *           format: uri
 *           example: https://github.com/builder
 *         linkedinUrl:
 *           type: string
 *           format: uri
 *           example: https://linkedin.com/in/builder
 *         resumeUrl:
 *           type: string
 *           format: uri
 *         currentRole:
 *           type: string
 *           example: Senior Developer at TechCorp
 *         lookingFor:
 *           type: string
 *           enum: [cofounder, full_time, part_time, advisory, project_based]
 *           example: cofounder
 *         rolesInterested:
 *           type: array
 *           items:
 *             type: string
 *             enum: [tech_cofounder, cto, lead_engineer, full_stack_dev, frontend_dev, backend_dev, mobile_dev, devops, designer, product_manager, growth_marketer, sales, operations]
 *           example: [tech_cofounder, cto]
 *         hoursPerWeek:
 *           type: integer
 *           example: 20
 *         riskAppetite:
 *           type: string
 *           enum: [conservative, moderate, aggressive]
 *           example: moderate
 *         compensationOpenness:
 *           type: array
 *           items:
 *             type: string
 *             enum: [equity_only, mostly_equity, balanced, mostly_cash, cash_only]
 *           example: [balanced, mostly_equity]
 *         industriesInterested:
 *           type: array
 *           items:
 *             type: string
 *           example: [Fintech, HealthTech, EdTech]
 *         remotePreference:
 *           type: string
 *           enum: [remote_only, hybrid, onsite_only, flexible]
 *           example: remote_only
 *         availability:
 *           type: string
 *           enum: [immediately, within_1_month, within_3_months, exploring]
 *           example: within_1_month
 *         profileCompleteness:
 *           type: integer
 *           example: 90
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     BuilderProfileInput:
 *       type: object
 *       properties:
 *         headline:
 *           type: string
 *         bio:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         yearsOfExperience:
 *           type: integer
 *         portfolioUrl:
 *           type: string
 *         githubUrl:
 *           type: string
 *         linkedinUrl:
 *           type: string
 *         currentRole:
 *           type: string
 *         lookingFor:
 *           type: string
 *           enum: [cofounder, full_time, part_time, advisory, project_based]
 *         rolesInterested:
 *           type: array
 *           items:
 *             type: string
 *         hoursPerWeek:
 *           type: integer
 *         riskAppetite:
 *           type: string
 *           enum: [conservative, moderate, aggressive]
 *         compensationOpenness:
 *           type: array
 *           items:
 *             type: string
 *         industriesInterested:
 *           type: array
 *           items:
 *             type: string
 *         remotePreference:
 *           type: string
 *           enum: [remote_only, hybrid, onsite_only, flexible]
 *         availability:
 *           type: string
 *           enum: [immediately, within_1_month, within_3_months, exploring]
 */

// ============================================
// OPENING SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Opening:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         founder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         founderProfile:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/FounderProfile'
 *         title:
 *           type: string
 *           example: Technical Co-founder for Fintech Startup
 *         roleType:
 *           type: string
 *           enum: [tech_cofounder, cto, lead_engineer, full_stack_dev, frontend_dev, backend_dev, mobile_dev, devops, designer, product_manager, growth_marketer, sales, operations]
 *           example: tech_cofounder
 *         description:
 *           type: string
 *           example: Looking for a technical co-founder to build our MVP
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *           example: [React, Node.js, MongoDB]
 *         equityRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               example: 5
 *             max:
 *               type: number
 *               example: 15
 *         cashRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               example: 0
 *             max:
 *               type: number
 *               example: 50000
 *         hoursPerWeek:
 *           type: integer
 *           example: 40
 *         remotePreference:
 *           type: string
 *           enum: [remote_only, hybrid, onsite_only, flexible]
 *           example: remote_only
 *         status:
 *           type: string
 *           enum: [active, paused, filled, closed]
 *           example: active
 *         viewCount:
 *           type: integer
 *           example: 150
 *         interestCount:
 *           type: integer
 *           example: 25
 *         filledBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     OpeningInput:
 *       type: object
 *       required:
 *         - title
 *         - roleType
 *         - skillsRequired
 *       properties:
 *         title:
 *           type: string
 *         roleType:
 *           type: string
 *           enum: [tech_cofounder, cto, lead_engineer, full_stack_dev, frontend_dev, backend_dev, mobile_dev, devops, designer, product_manager, growth_marketer, sales, operations]
 *         description:
 *           type: string
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *         equityRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         cashRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         hoursPerWeek:
 *           type: integer
 *         remotePreference:
 *           type: string
 *           enum: [remote_only, hybrid, onsite_only, flexible]
 */

// ============================================
// INTEREST SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Interest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         builder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         builderProfile:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/BuilderProfile'
 *         opening:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Opening'
 *         founder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         note:
 *           type: string
 *           example: I'm excited about this opportunity because...
 *         status:
 *           type: string
 *           enum: [pending, shortlisted, passed, withdrawn]
 *           example: pending
 *         isMutualMatch:
 *           type: boolean
 *           example: false
 *         shortlistedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     InterestInput:
 *       type: object
 *       properties:
 *         note:
 *           type: string
 *           description: Optional note to the founder
 */

// ============================================
// MATCH SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Match:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         opening:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Opening'
 *         builder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         builderProfile:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/BuilderProfile'
 *         founder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         score:
 *           type: number
 *           example: 0.85
 *         scoreBreakdown:
 *           type: object
 *           properties:
 *             skills:
 *               type: number
 *               example: 0.9
 *             compensation:
 *               type: number
 *               example: 0.8
 *             commitment:
 *               type: number
 *               example: 0.85
 *             scenario:
 *               type: number
 *               example: 0.75
 *             geography:
 *               type: number
 *               example: 1.0
 *         status:
 *           type: string
 *           enum: [pending, liked_by_builder, liked_by_founder, mutual, skipped, expired]
 *           example: pending
 *         founderAction:
 *           type: string
 *           enum: [none, like, skip, save]
 *           example: none
 *         builderAction:
 *           type: string
 *           enum: [none, like, skip, save]
 *           example: none
 *         isMutual:
 *           type: boolean
 *           example: false
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     MatchAction:
 *       type: object
 *       required:
 *         - action
 *       properties:
 *         action:
 *           type: string
 *           enum: [LIKE, SKIP, SAVE]
 *           example: LIKE
 */

// ============================================
// CONVERSATION SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         founder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         builder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         interest:
 *           type: string
 *         opening:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Opening'
 *         status:
 *           type: string
 *           enum: [active, archived, blocked]
 *           example: active
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *         lastMessageAt:
 *           type: string
 *           format: date-time
 *         founderUnreadCount:
 *           type: integer
 *           example: 0
 *         builderUnreadCount:
 *           type: integer
 *           example: 2
 *         hasTrial:
 *           type: boolean
 *           example: false
 *         trial:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         conversation:
 *           type: string
 *         sender:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         content:
 *           type: string
 *           example: Hello! I'd love to discuss this opportunity.
 *         messageType:
 *           type: string
 *           enum: [text, system, ice_breaker, trial_proposal, trial_update, attachment]
 *           example: text
 *         attachmentUrl:
 *           type: string
 *         attachmentType:
 *           type: string
 *         isRead:
 *           type: boolean
 *           example: false
 *         readAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     MessageInput:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           example: Hello! I'd love to discuss this opportunity.
 *         messageType:
 *           type: string
 *           enum: [text, attachment]
 *           default: text
 *         attachmentUrl:
 *           type: string
 */

// ============================================
// TRIAL SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Trial:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         conversation:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Conversation'
 *         founder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         builder:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *         proposedBy:
 *           type: string
 *         status:
 *           type: string
 *           enum: [proposed, active, completed, cancelled, declined]
 *           example: proposed
 *         durationDays:
 *           type: integer
 *           enum: [7, 14, 21]
 *           example: 14
 *         goal:
 *           type: string
 *           example: Build MVP landing page with user authentication
 *         checkinFrequency:
 *           type: string
 *           enum: [daily, every_2_days, weekly]
 *           example: every_2_days
 *         startsAt:
 *           type: string
 *           format: date-time
 *         endsAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *         cancelReason:
 *           type: string
 *         founderFeedback:
 *           $ref: '#/components/schemas/TrialFeedback'
 *         builderFeedback:
 *           $ref: '#/components/schemas/TrialFeedback'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     TrialProposalInput:
 *       type: object
 *       required:
 *         - conversationId
 *         - durationDays
 *         - goal
 *       properties:
 *         conversationId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         durationDays:
 *           type: integer
 *           enum: [7, 14, 21]
 *           example: 14
 *         goal:
 *           type: string
 *           example: Build MVP landing page
 *         checkinFrequency:
 *           type: string
 *           enum: [daily, every_2_days, weekly]
 *           default: every_2_days
 *
 *     TrialFeedback:
 *       type: object
 *       properties:
 *         communication:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         reliability:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         skillMatch:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         wouldContinue:
 *           type: boolean
 *           example: true
 *         privateNotes:
 *           type: string
 *           example: Great collaboration, would love to work together
 *         submittedAt:
 *           type: string
 *           format: date-time
 *
 *     TrialFeedbackInput:
 *       type: object
 *       required:
 *         - communication
 *         - reliability
 *         - skillMatch
 *         - wouldContinue
 *       properties:
 *         communication:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         reliability:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         skillMatch:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         wouldContinue:
 *           type: boolean
 *           example: true
 *         privateNotes:
 *           type: string
 */

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           type: string
 *         type:
 *           type: string
 *           enum: [NEW_MATCH, NEW_INTEREST, SHORTLISTED, NEW_MESSAGE, TRIAL_PROPOSED, TRIAL_ACCEPTED, TRIAL_COMPLETED, TRIAL_REMINDER, SYSTEM]
 *           example: NEW_MESSAGE
 *         title:
 *           type: string
 *           example: New message received
 *         message:
 *           type: string
 *           example: John Doe sent you a message
 *         data:
 *           type: object
 *           properties:
 *             conversationId:
 *               type: string
 *             matchId:
 *               type: string
 *             interestId:
 *               type: string
 *             trialId:
 *               type: string
 *             fromUserId:
 *               type: string
 *             fromUserName:
 *               type: string
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           example: normal
 *         read:
 *           type: boolean
 *           example: false
 *         readAt:
 *           type: string
 *           format: date-time
 *         clicked:
 *           type: boolean
 *           example: false
 *         clickedAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// ============================================
// SCENARIO SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     ScenarioResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         scenario1:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario2:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario3:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario4:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario5:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario6:
 *           type: string
 *           enum: [A, B, C, D]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ScenarioInput:
 *       type: object
 *       required:
 *         - scenario1
 *         - scenario2
 *         - scenario3
 *         - scenario4
 *         - scenario5
 *         - scenario6
 *       properties:
 *         scenario1:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario2:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario3:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario4:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario5:
 *           type: string
 *           enum: [A, B, C, D]
 *         scenario6:
 *           type: string
 *           enum: [A, B, C, D]
 */

module.exports = {};
