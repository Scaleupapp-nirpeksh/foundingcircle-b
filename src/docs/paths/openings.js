/**
 * @fileoverview Opening API Documentation
 * @module docs/paths/openings
 */

/**
 * @swagger
 * /openings:
 *   get:
 *     summary: Search openings
 *     description: Search openings with various filters (requires complete profile)
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roleType
 *         schema:
 *           type: string
 *           enum: [tech_cofounder, cto, lead_engineer, full_stack_dev, frontend_dev, backend_dev, mobile_dev, devops, designer, product_manager, growth_marketer, sales, operations]
 *         description: Filter by role type
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by required skills
 *       - in: query
 *         name: startupStage
 *         schema:
 *           type: string
 *           enum: [idea, mvp, early_revenue, scaling, funded]
 *         description: Filter by startup stage
 *       - in: query
 *         name: minEquity
 *         schema:
 *           type: number
 *         description: Minimum equity percentage
 *       - in: query
 *         name: remotePreference
 *         schema:
 *           type: string
 *           enum: [remote_only, hybrid, onsite_only, flexible]
 *         description: Filter by remote preference
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Openings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Opening'
 *       403:
 *         description: Complete profile required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create opening
 *     description: Create a new job/role opening (Founders only)
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpeningInput'
 *     responses:
 *       201:
 *         description: Opening created successfully
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
 *                   example: Opening created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     opening:
 *                       $ref: '#/components/schemas/Opening'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Founders only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /openings/featured:
 *   get:
 *     summary: Get featured openings
 *     description: Get featured/recent openings (public)
 *     tags: [Openings]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of openings to return
 *     responses:
 *       200:
 *         description: Featured openings retrieved
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
 *                     openings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Opening'
 */

/**
 * @swagger
 * /openings/my:
 *   get:
 *     summary: Get my openings
 *     description: Get current founder's openings
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, filled, closed]
 *         description: Filter by status
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
 *         description: Openings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         description: Founders only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /openings/my/stats:
 *   get:
 *     summary: Get my opening stats
 *     description: Get statistics for current founder's openings
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved
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
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     active:
 *                       type: integer
 *                       example: 3
 *                     paused:
 *                       type: integer
 *                       example: 1
 *                     filled:
 *                       type: integer
 *                       example: 1
 *                     totalViews:
 *                       type: integer
 *                       example: 500
 *                     totalInterests:
 *                       type: integer
 *                       example: 75
 */

/**
 * @swagger
 * /openings/recommended:
 *   get:
 *     summary: Get recommended openings
 *     description: Get openings matching builder's profile (Builders only)
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Recommended openings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Opening'
 *                               - type: object
 *                                 properties:
 *                                   matchScore:
 *                                     type: number
 *                                     example: 0.85
 *       403:
 *         description: Builders only with complete profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /openings/stats:
 *   get:
 *     summary: Get platform opening statistics
 *     description: Get platform-wide opening statistics (Admin only)
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
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
 *                     total:
 *                       type: integer
 *                       example: 250
 *                     active:
 *                       type: integer
 *                       example: 180
 *                     byRoleType:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     avgInterestsPerOpening:
 *                       type: number
 *                       example: 12.5
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /openings/role/{roleType}:
 *   get:
 *     summary: Get openings by role type
 *     description: Get openings filtered by role type
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tech_cofounder, cto, lead_engineer, full_stack_dev, frontend_dev, backend_dev, mobile_dev, devops, designer, product_manager, growth_marketer, sales, operations]
 *         description: Role type
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
 *         description: Openings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /openings/{id}:
 *   get:
 *     summary: Get opening by ID
 *     description: Get a specific opening by its ID
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *       - in: query
 *         name: includeFounder
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include founder profile data
 *     responses:
 *       200:
 *         description: Opening retrieved
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
 *                     opening:
 *                       $ref: '#/components/schemas/Opening'
 *       404:
 *         description: Opening not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   patch:
 *     summary: Update opening
 *     description: Update an opening (Owner only)
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpeningInput'
 *     responses:
 *       200:
 *         description: Opening updated
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
 *                     opening:
 *                       $ref: '#/components/schemas/Opening'
 *       403:
 *         description: Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete opening
 *     description: Soft delete an opening (Owner only)
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *     responses:
 *       200:
 *         description: Opening deleted
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
 *                   example: Opening deleted successfully
 */

/**
 * @swagger
 * /openings/{id}/pause:
 *   post:
 *     summary: Pause opening
 *     description: Pause an active opening
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *     responses:
 *       200:
 *         description: Opening paused
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
 *                   example: Opening paused
 */

/**
 * @swagger
 * /openings/{id}/resume:
 *   post:
 *     summary: Resume opening
 *     description: Resume a paused opening
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *     responses:
 *       200:
 *         description: Opening resumed
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
 *                   example: Opening resumed
 */

/**
 * @swagger
 * /openings/{id}/fill:
 *   post:
 *     summary: Mark opening as filled
 *     description: Mark an opening as filled
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filledBy:
 *                 type: string
 *                 description: User ID who filled the position
 *     responses:
 *       200:
 *         description: Opening marked as filled
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
 *                   example: Opening marked as filled
 */

/**
 * @swagger
 * /openings/{id}/interest:
 *   post:
 *     summary: Express interest in opening
 *     description: Express interest in an opening
 *     tags: [Openings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *     responses:
 *       201:
 *         description: Interest expressed
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
 *                   example: Interest expressed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     interest:
 *                       $ref: '#/components/schemas/Interest'
 *       400:
 *         description: Already expressed interest
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
