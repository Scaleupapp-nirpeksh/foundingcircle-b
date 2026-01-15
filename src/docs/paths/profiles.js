/**
 * @fileoverview Profile API Documentation
 * @module docs/paths/profiles
 */

/**
 * @swagger
 * /profiles/me:
 *   get:
 *     summary: Get current user's profile
 *     description: Get the current user's profile (auto-detects type based on active role)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/FounderProfile'
 *                         - $ref: '#/components/schemas/BuilderProfile'
 *                     type:
 *                       type: string
 *                       enum: [founder, builder]
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   patch:
 *     summary: Update current user's profile
 *     description: Update the current user's profile (auto-detects type)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [founder, builder]
 *         description: Specify profile type (optional, defaults to active role)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/FounderProfileInput'
 *               - $ref: '#/components/schemas/BuilderProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 */

/**
 * @swagger
 * /profiles/me/all:
 *   get:
 *     summary: Get all profiles for current user
 *     description: Get both founder and builder profiles if they exist
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     founderProfile:
 *                       $ref: '#/components/schemas/FounderProfile'
 *                     builderProfile:
 *                       $ref: '#/components/schemas/BuilderProfile'
 *                     activeRole:
 *                       type: string
 *                       enum: [founder, builder]
 */

/**
 * @swagger
 * /profiles/me/active:
 *   get:
 *     summary: Get current user's active profile
 *     description: Get the profile for the user's currently active role
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/FounderProfile'
 *                         - $ref: '#/components/schemas/BuilderProfile'
 *                     activeRole:
 *                       type: string
 *                       enum: [founder, builder]
 */

/**
 * @swagger
 * /profiles/me/can-create/{type}:
 *   get:
 *     summary: Check if user can create profile type
 *     description: Check if the user can create a specific profile type
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [founder, builder]
 *         description: Profile type to check
 *     responses:
 *       200:
 *         description: Check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     canCreate:
 *                       type: boolean
 *                       example: true
 *                     reason:
 *                       type: string
 *                       description: Reason if cannot create
 */

/**
 * @swagger
 * /profiles/founder:
 *   post:
 *     summary: Create founder profile
 *     description: Create a founder profile for the current user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FounderProfileInput'
 *     responses:
 *       201:
 *         description: Founder profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Founder profile created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/FounderProfile'
 *       400:
 *         description: Profile already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /profiles/founder/me:
 *   get:
 *     summary: Get current user's founder profile
 *     description: Get the founder profile for the current user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Founder profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/FounderProfile'
 *       404:
 *         description: Founder profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   patch:
 *     summary: Update current user's founder profile
 *     description: Update the founder profile for the current user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FounderProfileInput'
 *     responses:
 *       200:
 *         description: Founder profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/FounderProfile'
 */

/**
 * @swagger
 * /profiles/founder/me/completion:
 *   get:
 *     summary: Get founder profile completion status
 *     description: Get the completion percentage and missing fields for founder profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completion status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     completeness:
 *                       type: integer
 *                       example: 85
 *                     missingFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [pitchDeckUrl, linkedinUrl]
 *                     isComplete:
 *                       type: boolean
 *                       example: false
 */

/**
 * @swagger
 * /profiles/founder/{id}:
 *   get:
 *     summary: Get founder profile by ID
 *     description: Get a specific founder profile by its ID
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Founder profile ID
 *     responses:
 *       200:
 *         description: Founder profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/FounderProfile'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /profiles/founder/me/pitch-deck:
 *   post:
 *     summary: Upload pitch deck
 *     description: Upload a pitch deck PDF for the founder profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pitchDeck:
 *                 type: string
 *                 format: binary
 *                 description: PDF file (max 10MB)
 *     responses:
 *       200:
 *         description: Pitch deck uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pitch deck uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     pitchDeckUrl:
 *                       type: string
 *                       example: https://s3.amazonaws.com/bucket/pitch.pdf
 *       400:
 *         description: Invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete pitch deck
 *     description: Remove the pitch deck from founder profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pitch deck deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pitch deck deleted successfully
 */

/**
 * @swagger
 * /profiles/builder:
 *   post:
 *     summary: Create builder profile
 *     description: Create a builder profile for the current user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BuilderProfileInput'
 *     responses:
 *       201:
 *         description: Builder profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Builder profile created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/BuilderProfile'
 */

/**
 * @swagger
 * /profiles/builder/me:
 *   get:
 *     summary: Get current user's builder profile
 *     description: Get the builder profile for the current user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Builder profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/BuilderProfile'
 *
 *   patch:
 *     summary: Update current user's builder profile
 *     description: Update the builder profile for the current user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BuilderProfileInput'
 *     responses:
 *       200:
 *         description: Builder profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/BuilderProfile'
 */

/**
 * @swagger
 * /profiles/builder/me/completion:
 *   get:
 *     summary: Get builder profile completion status
 *     description: Get the completion percentage and missing fields for builder profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completion status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     completeness:
 *                       type: integer
 *                       example: 90
 *                     missingFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                     isComplete:
 *                       type: boolean
 *                       example: true
 */

/**
 * @swagger
 * /profiles/builder/{id}:
 *   get:
 *     summary: Get builder profile by ID
 *     description: Get a specific builder profile by its ID
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Builder profile ID
 *     responses:
 *       200:
 *         description: Builder profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/BuilderProfile'
 */

/**
 * @swagger
 * /profiles/secondary/{type}:
 *   post:
 *     summary: Add secondary profile
 *     description: Add a secondary profile type for dual profile support
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [founder, builder]
 *         description: Profile type to add
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/FounderProfileInput'
 *               - $ref: '#/components/schemas/BuilderProfileInput'
 *     responses:
 *       201:
 *         description: Secondary profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Secondary profile created successfully
 */

/**
 * @swagger
 * /profiles/switch-role:
 *   post:
 *     summary: Switch active role
 *     description: Switch between founder and builder roles
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [founder, builder]
 *                 example: builder
 *     responses:
 *       200:
 *         description: Role switched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Switched to builder role
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeRole:
 *                       type: string
 *                       example: builder
 *       400:
 *         description: Cannot switch - profile doesn't exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /profiles/scenarios:
 *   post:
 *     summary: Save scenario responses
 *     description: Save scenario questionnaire responses for matching
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScenarioInput'
 *     responses:
 *       200:
 *         description: Scenarios saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Scenario responses saved
 */

/**
 * @swagger
 * /profiles/scenarios/me:
 *   get:
 *     summary: Get current user's scenarios
 *     description: Get the current user's scenario responses
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scenarios retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     scenarios:
 *                       $ref: '#/components/schemas/ScenarioResponse'
 */

/**
 * @swagger
 * /profiles/scenarios/compatibility/{userId}:
 *   get:
 *     summary: Get scenario compatibility
 *     description: Calculate scenario-based compatibility with another user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Other user's ID
 *     responses:
 *       200:
 *         description: Compatibility calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     compatibilityScore:
 *                       type: number
 *                       example: 0.75
 *                     matchingScenarios:
 *                       type: integer
 *                       example: 4
 *                     totalScenarios:
 *                       type: integer
 *                       example: 6
 */

/**
 * @swagger
 * /profiles/search/builders:
 *   get:
 *     summary: Search builder profiles
 *     description: Search and filter builder profiles
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by skills
 *       - in: query
 *         name: riskAppetite
 *         schema:
 *           type: string
 *           enum: [conservative, moderate, aggressive]
 *         description: Filter by risk appetite
 *       - in: query
 *         name: compensationOpenness
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by compensation preferences
 *       - in: query
 *         name: minHours
 *         schema:
 *           type: integer
 *         description: Minimum hours per week
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: rolesInterested
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by roles interested in
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Builders found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /profiles/search/founders:
 *   get:
 *     summary: Search founder profiles
 *     description: Search and filter founder profiles
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startupStage
 *         schema:
 *           type: string
 *           enum: [idea, mvp, early_revenue, scaling, funded]
 *         description: Filter by startup stage
 *       - in: query
 *         name: rolesSeeking
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by roles seeking
 *       - in: query
 *         name: minEquity
 *         schema:
 *           type: number
 *         description: Minimum equity offered
 *       - in: query
 *         name: minCash
 *         schema:
 *           type: number
 *         description: Minimum cash compensation
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Founders found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

module.exports = {};
