/**
 * @fileoverview Interest API Documentation
 * @module docs/paths/interests
 */

/**
 * @swagger
 * /interests/my:
 *   get:
 *     summary: Get builder's interests
 *     description: Get all interests expressed by the current builder
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, shortlisted, passed, withdrawn]
 *         description: Filter by interest status
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
 *         description: Interests retrieved
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
 *                             $ref: '#/components/schemas/Interest'
 *       403:
 *         description: Builders only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /interests/my/today:
 *   get:
 *     summary: Get today's interest count
 *     description: Get the number of interests expressed today by the builder
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count retrieved
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
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     limit:
 *                       type: integer
 *                       example: 5
 *                     remaining:
 *                       type: integer
 *                       example: 2
 */

/**
 * @swagger
 * /interests/openings/{openingId}:
 *   post:
 *     summary: Express interest in opening
 *     description: Express interest in a specific opening (Builders only)
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: openingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Opening ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InterestInput'
 *     responses:
 *       201:
 *         description: Interest expressed successfully
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
 *         description: Already expressed interest or daily limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Builders only with complete profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Opening not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /interests/{id}/withdraw:
 *   post:
 *     summary: Withdraw interest
 *     description: Withdraw a previously expressed interest
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interest ID
 *     responses:
 *       200:
 *         description: Interest withdrawn
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
 *                   example: Interest withdrawn successfully
 *       400:
 *         description: Cannot withdraw - already processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Interest not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /interests/received:
 *   get:
 *     summary: Get received interests
 *     description: Get interests received for founder's openings
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: openingId
 *         schema:
 *           type: string
 *         description: Filter by specific opening
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, shortlisted, passed, withdrawn]
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
 *         description: Interests retrieved
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
 * /interests/received/pending/count:
 *   get:
 *     summary: Get pending interests count
 *     description: Get count of pending interests for founder
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count retrieved
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
 *                     count:
 *                       type: integer
 *                       example: 15
 */

/**
 * @swagger
 * /interests/{id}/shortlist:
 *   post:
 *     summary: Shortlist a builder
 *     description: Shortlist a builder, creating a mutual match
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interest ID
 *     responses:
 *       200:
 *         description: Builder shortlisted
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
 *                   example: Builder shortlisted - mutual match created!
 *                 data:
 *                   type: object
 *                   properties:
 *                     interest:
 *                       $ref: '#/components/schemas/Interest'
 *                     isMutualMatch:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Interest already processed
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
 * /interests/{id}/pass:
 *   post:
 *     summary: Pass on a builder
 *     description: Pass on/reject a builder's interest
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interest ID
 *     responses:
 *       200:
 *         description: Passed on builder
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
 *                   example: Passed on builder
 */

/**
 * @swagger
 * /interests/matches:
 *   get:
 *     summary: Get mutual matches
 *     description: Get all mutual matches for the current user
 *     tags: [Interests]
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
 *         description: Matches retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /interests/matches/check/{userId}:
 *   get:
 *     summary: Check mutual match
 *     description: Check if a mutual match exists with another user
 *     tags: [Interests]
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
 *         description: Match check completed
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
 *                     isMutualMatch:
 *                       type: boolean
 *                       example: true
 *                     interest:
 *                       $ref: '#/components/schemas/Interest'
 */

/**
 * @swagger
 * /interests/matches/{id}:
 *   get:
 *     summary: Get match by ID
 *     description: Get a specific match/interest by ID
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interest/Match ID
 *     responses:
 *       200:
 *         description: Match retrieved
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
 *                     interest:
 *                       $ref: '#/components/schemas/Interest'
 *       403:
 *         description: Not a participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Match not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /interests/stats:
 *   get:
 *     summary: Get interest statistics
 *     description: Get interest statistics for the current user
 *     tags: [Interests]
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
 *                     totalSent:
 *                       type: integer
 *                       example: 20
 *                       description: For builders
 *                     totalReceived:
 *                       type: integer
 *                       example: 50
 *                       description: For founders
 *                     pending:
 *                       type: integer
 *                       example: 5
 *                     shortlisted:
 *                       type: integer
 *                       example: 10
 *                     mutualMatches:
 *                       type: integer
 *                       example: 8
 *                     conversionRate:
 *                       type: number
 *                       example: 0.4
 */

module.exports = {};
