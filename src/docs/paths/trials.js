/**
 * @fileoverview Trial API Documentation
 * @module docs/paths/trials
 */

/**
 * @swagger
 * /trials:
 *   get:
 *     summary: Get user trials
 *     description: Get all trials for the current user
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [proposed, active, completed, cancelled, declined]
 *         description: Filter by trial status
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
 *         description: Trials retrieved
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
 *                             $ref: '#/components/schemas/Trial'
 */

/**
 * @swagger
 * /trials/stats:
 *   get:
 *     summary: Get trial statistics
 *     description: Get trial statistics for the current user
 *     tags: [Trials]
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
 *                       example: 10
 *                     active:
 *                       type: integer
 *                       example: 2
 *                     completed:
 *                       type: integer
 *                       example: 6
 *                     cancelled:
 *                       type: integer
 *                       example: 1
 *                     successRate:
 *                       type: number
 *                       example: 0.85
 *                       description: Percentage of completed trials with positive feedback
 */

/**
 * @swagger
 * /trials/active:
 *   get:
 *     summary: Get active trials
 *     description: Get currently active trials for the user
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active trials retrieved
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
 *                     trials:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Trial'
 */

/**
 * @swagger
 * /trials/conversation/{conversationId}:
 *   get:
 *     summary: Get trial for conversation
 *     description: Get the trial associated with a specific conversation
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Trial retrieved
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
 *                     trial:
 *                       $ref: '#/components/schemas/Trial'
 *       404:
 *         description: No trial for this conversation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/admin/ending-soon:
 *   get:
 *     summary: Get trials ending soon
 *     description: Get trials ending within specified days (Admin only)
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Trials retrieved
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
 *                     trials:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Trial'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/admin/auto-complete:
 *   post:
 *     summary: Auto-complete expired trials
 *     description: Trigger auto-completion of expired trials (Admin only)
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto-completion triggered
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
 *                   example: Auto-completed 5 trials
 *                 data:
 *                   type: object
 *                   properties:
 *                     completedCount:
 *                       type: integer
 *                       example: 5
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/propose:
 *   post:
 *     summary: Propose a trial
 *     description: Propose a trial collaboration in a conversation
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrialProposalInput'
 *     responses:
 *       201:
 *         description: Trial proposed
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
 *                   example: Trial proposed
 *                 data:
 *                   type: object
 *                   properties:
 *                     trial:
 *                       $ref: '#/components/schemas/Trial'
 *       400:
 *         description: Active trial already exists for this conversation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not a conversation participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/{id}:
 *   get:
 *     summary: Get trial by ID
 *     description: Get a specific trial by its ID
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trial ID
 *     responses:
 *       200:
 *         description: Trial retrieved
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
 *                     trial:
 *                       $ref: '#/components/schemas/Trial'
 *       403:
 *         description: Not a trial participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Trial not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/{id}/accept:
 *   post:
 *     summary: Accept trial proposal
 *     description: Accept a trial proposal (starts the trial)
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trial ID
 *     responses:
 *       200:
 *         description: Trial accepted and started
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
 *                   example: Trial accepted and started
 *                 data:
 *                   type: object
 *                   properties:
 *                     trial:
 *                       $ref: '#/components/schemas/Trial'
 *       400:
 *         description: Trial not in proposed status or self-acceptance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/{id}/decline:
 *   post:
 *     summary: Decline trial proposal
 *     description: Decline a trial proposal
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trial ID
 *     responses:
 *       200:
 *         description: Trial declined
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
 *                   example: Trial declined
 *       400:
 *         description: Trial not in proposed status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/{id}/cancel:
 *   post:
 *     summary: Cancel trial
 *     description: Cancel an active or proposed trial
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trial ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Trial cancelled
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
 *                   example: Trial cancelled
 *       400:
 *         description: Trial cannot be cancelled (already completed/cancelled)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/{id}/complete:
 *   post:
 *     summary: Complete trial
 *     description: Manually complete an active trial
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trial ID
 *     responses:
 *       200:
 *         description: Trial completed
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
 *                   example: Trial completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     trial:
 *                       $ref: '#/components/schemas/Trial'
 *       400:
 *         description: Trial not in active status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /trials/{id}/feedback:
 *   post:
 *     summary: Submit trial feedback
 *     description: Submit feedback for a completed trial
 *     tags: [Trials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trial ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrialFeedbackInput'
 *     responses:
 *       200:
 *         description: Feedback submitted
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
 *                   example: Feedback submitted
 *                 data:
 *                   type: object
 *                   properties:
 *                     trial:
 *                       $ref: '#/components/schemas/Trial'
 *       400:
 *         description: Trial not completed or feedback already submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
