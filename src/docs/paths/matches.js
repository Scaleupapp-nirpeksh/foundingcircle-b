/**
 * @fileoverview Matching API Documentation
 * @module docs/paths/matches
 */

/**
 * @swagger
 * /matches/algorithm-info:
 *   get:
 *     summary: Get algorithm info
 *     description: Get matching algorithm weights and thresholds
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Algorithm info retrieved
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
 *                     weights:
 *                       type: object
 *                       properties:
 *                         skills:
 *                           type: number
 *                           example: 0.25
 *                         compensation:
 *                           type: number
 *                           example: 0.25
 *                         commitment:
 *                           type: number
 *                           example: 0.20
 *                         scenario:
 *                           type: number
 *                           example: 0.15
 *                         geography:
 *                           type: number
 *                           example: 0.15
 *                     thresholds:
 *                       type: object
 *                       properties:
 *                         minimum:
 *                           type: number
 *                           example: 0.5
 *                         good:
 *                           type: number
 *                           example: 0.7
 *                         excellent:
 *                           type: number
 *                           example: 0.85
 */

/**
 * @swagger
 * /matches/daily/founder:
 *   get:
 *     summary: Get daily matches for founder
 *     description: Get algorithm-generated daily matches for a founder
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of matches to return
 *     responses:
 *       200:
 *         description: Daily matches retrieved
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
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Match'
 *                     remaining:
 *                       type: integer
 *                       example: 3
 *                       description: Remaining matches for today
 *       403:
 *         description: Founders only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /matches/daily/builder:
 *   get:
 *     summary: Get daily matches for builder
 *     description: Get algorithm-generated daily matches for a builder
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of matches to return
 *     responses:
 *       200:
 *         description: Daily matches retrieved
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
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Match'
 *                     remaining:
 *                       type: integer
 *                       example: 2
 *       403:
 *         description: Builders only with complete profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /matches/mutual:
 *   get:
 *     summary: Get mutual matches
 *     description: Get all mutual matches where both parties have liked
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mutual matches retrieved
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
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Match'
 */

/**
 * @swagger
 * /matches/compatibility:
 *   get:
 *     summary: Calculate compatibility
 *     description: Calculate compatibility score between an opening and builder
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: openingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *       - in: query
 *         name: builderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Builder user ID
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
 *                     score:
 *                       type: number
 *                       example: 0.82
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         skills:
 *                           type: number
 *                           example: 0.9
 *                         compensation:
 *                           type: number
 *                           example: 0.75
 *                         commitment:
 *                           type: number
 *                           example: 0.8
 *                         scenario:
 *                           type: number
 *                           example: 0.7
 *                         geography:
 *                           type: number
 *                           example: 1.0
 *                     recommendation:
 *                       type: string
 *                       enum: [excellent, good, fair, low]
 *                       example: excellent
 *       400:
 *         description: Missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /matches/generate/opening/{openingId}:
 *   post:
 *     summary: Generate matches for opening
 *     description: Generate new matches for a specific opening
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: openingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum matches to generate
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           default: 0.5
 *         description: Minimum compatibility score
 *     responses:
 *       200:
 *         description: Matches generated
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
 *                   example: Generated 15 matches
 *                 data:
 *                   type: object
 *                   properties:
 *                     matchesCreated:
 *                       type: integer
 *                       example: 15
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Match'
 *       403:
 *         description: Founders only / Not opening owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /matches/generate/builder:
 *   post:
 *     summary: Generate matches for builder
 *     description: Generate new matches for the current builder
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum matches to generate
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           default: 0.5
 *         description: Minimum compatibility score
 *     responses:
 *       200:
 *         description: Matches generated
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
 *                   example: Generated 12 matches
 *                 data:
 *                   type: object
 *                   properties:
 *                     matchesCreated:
 *                       type: integer
 *                       example: 12
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Match'
 *       403:
 *         description: Builders only with complete profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /matches/admin/run-nightly:
 *   post:
 *     summary: Run nightly match generation
 *     description: Manually trigger the nightly match generation job (Admin only)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nightly job triggered
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
 *                   example: Nightly match generation completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     openingsProcessed:
 *                       type: integer
 *                       example: 150
 *                     matchesCreated:
 *                       type: integer
 *                       example: 500
 *                     matchesUpdated:
 *                       type: integer
 *                       example: 200
 *                     errors:
 *                       type: integer
 *                       example: 0
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /matches/{id}/action:
 *   post:
 *     summary: Record match action
 *     description: Record a like, skip, or save action on a match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MatchAction'
 *     responses:
 *       200:
 *         description: Action recorded
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
 *                   example: Action recorded
 *                 data:
 *                   type: object
 *                   properties:
 *                     match:
 *                       $ref: '#/components/schemas/Match'
 *                     isMutual:
 *                       type: boolean
 *                       example: true
 *                       description: True if this action created a mutual match
 *       400:
 *         description: Invalid action or already actioned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not a match participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /matches/{id}/like:
 *   post:
 *     summary: Like a match
 *     description: Express interest in a match (shortcut for action=LIKE)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match liked
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
 *                   example: Match liked
 *                 data:
 *                   type: object
 *                   properties:
 *                     match:
 *                       $ref: '#/components/schemas/Match'
 *                     isMutual:
 *                       type: boolean
 *                       example: false
 */

/**
 * @swagger
 * /matches/{id}/skip:
 *   post:
 *     summary: Skip a match
 *     description: Skip/pass on a match (shortcut for action=SKIP)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match skipped
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
 *                   example: Match skipped
 */

/**
 * @swagger
 * /matches/{id}/save:
 *   post:
 *     summary: Save a match
 *     description: Save a match for later review (shortcut for action=SAVE)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match saved
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
 *                   example: Match saved for later
 */

module.exports = {};
