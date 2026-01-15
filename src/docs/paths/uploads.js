/**
 * @fileoverview Upload API Documentation
 * @module docs/paths/uploads
 */

/**
 * @swagger
 * /uploads/profile-photo:
 *   post:
 *     summary: Upload profile photo
 *     description: Upload a profile photo for the current user
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profilePhoto
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
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
 *                   example: Profile photo uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://s3.amazonaws.com/bucket/photos/user-123.jpg
 *                     key:
 *                       type: string
 *                       example: photos/user-123.jpg
 *       400:
 *         description: Invalid file type or size exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete profile photo
 *     description: Remove the current user's profile photo
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Photo deleted successfully
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
 *                   example: Profile photo deleted successfully
 *       404:
 *         description: No profile photo found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /uploads/pitch-deck:
 *   post:
 *     summary: Upload pitch deck
 *     description: Upload a pitch deck PDF for founders
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pitchDeck
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
 *                     url:
 *                       type: string
 *                       example: https://s3.amazonaws.com/bucket/decks/pitch-123.pdf
 *                     key:
 *                       type: string
 *                       example: decks/pitch-123.pdf
 *       400:
 *         description: Invalid file type (PDF only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Only founders can upload pitch decks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete pitch deck
 *     description: Remove the founder's pitch deck
 *     tags: [Uploads]
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
 * /uploads/document:
 *   post:
 *     summary: Upload document
 *     description: Upload a general document (PDF, images)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, JPEG, PNG, max 10MB)
 *     responses:
 *       200:
 *         description: Document uploaded successfully
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
 *                   example: Document uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://s3.amazonaws.com/bucket/docs/doc-123.pdf
 *                     key:
 *                       type: string
 *                       example: docs/doc-123.pdf
 *                     mimetype:
 *                       type: string
 *                       example: application/pdf
 *                     size:
 *                       type: integer
 *                       example: 1024000
 */

/**
 * @swagger
 * /uploads/attachment:
 *   post:
 *     summary: Upload message attachment
 *     description: Upload an attachment for use in messages
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - attachment
 *             properties:
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: File attachment (images, PDFs, max 10MB)
 *     responses:
 *       200:
 *         description: Attachment uploaded successfully
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
 *                   example: Attachment uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://s3.amazonaws.com/bucket/attachments/attach-123.pdf
 *                     key:
 *                       type: string
 *                       example: attachments/attach-123.pdf
 *                     mimetype:
 *                       type: string
 *                       example: image/jpeg
 *                     filename:
 *                       type: string
 *                       example: screenshot.jpg
 */

/**
 * @swagger
 * /uploads/presigned-url:
 *   post:
 *     summary: Get pre-signed upload URL
 *     description: Get a pre-signed URL for direct upload to S3
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - mimetype
 *               - type
 *             properties:
 *               filename:
 *                 type: string
 *                 example: photo.jpg
 *               mimetype:
 *                 type: string
 *                 example: image/jpeg
 *               type:
 *                 type: string
 *                 enum: [profile-photo, pitch-deck, document, attachment]
 *                 example: profile-photo
 *     responses:
 *       200:
 *         description: Pre-signed URL generated
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
 *                     uploadUrl:
 *                       type: string
 *                       description: Pre-signed URL for upload
 *                       example: https://bucket.s3.amazonaws.com/...?X-Amz-Signature=...
 *                     fileUrl:
 *                       type: string
 *                       description: Final URL after upload
 *                       example: https://s3.amazonaws.com/bucket/photos/user-123.jpg
 *                     key:
 *                       type: string
 *                       example: photos/user-123.jpg
 *                     expiresIn:
 *                       type: integer
 *                       description: URL expiry in seconds
 *                       example: 3600
 *       400:
 *         description: Invalid file type for specified upload type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /uploads/file:
 *   delete:
 *     summary: Delete file by URL
 *     description: Delete a file from storage using its URL
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://s3.amazonaws.com/bucket/photos/user-123.jpg
 *     responses:
 *       200:
 *         description: File deleted successfully
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
 *                   example: File deleted successfully
 *       400:
 *         description: Invalid URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
