/**
 * @fileoverview Upload Routes
 *
 * Defines all file upload API endpoints.
 *
 * @module routes/upload
 */

const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/upload.controller');
const { auth, requireFounder } = require('../../../shared/middleware/auth');
const {
  uploadProfilePhoto,
  uploadPitchDeck,
  uploadDocument,
  uploadAttachment,
  requireFile,
} = require('../../../shared/middleware/upload');

// ============================================
// PROFILE PHOTO ROUTES
// ============================================

/**
 * @route   POST /api/v1/uploads/profile-photo
 * @desc    Upload profile photo for current user
 * @access  Private
 * @body    multipart/form-data with 'profilePhoto' field
 */
router.post(
  '/profile-photo',
  auth,
  uploadProfilePhoto,
  requireFile,
  uploadController.uploadProfilePhoto
);

/**
 * @route   DELETE /api/v1/uploads/profile-photo
 * @desc    Delete profile photo for current user
 * @access  Private
 */
router.delete('/profile-photo', auth, uploadController.deleteProfilePhoto);

// ============================================
// PITCH DECK ROUTES
// ============================================

/**
 * @route   POST /api/v1/uploads/pitch-deck
 * @desc    Upload pitch deck for founder profile
 * @access  Private (Founders only)
 * @body    multipart/form-data with 'pitchDeck' field
 */
router.post(
  '/pitch-deck',
  auth,
  requireFounder,
  uploadPitchDeck,
  requireFile,
  uploadController.uploadPitchDeck
);

/**
 * @route   DELETE /api/v1/uploads/pitch-deck
 * @desc    Delete pitch deck for founder profile
 * @access  Private (Founders only)
 */
router.delete('/pitch-deck', auth, requireFounder, uploadController.deletePitchDeck);

// ============================================
// DOCUMENT ROUTES
// ============================================

/**
 * @route   POST /api/v1/uploads/document
 * @desc    Upload a general document
 * @access  Private
 * @body    multipart/form-data with 'document' field
 */
router.post(
  '/document',
  auth,
  uploadDocument,
  requireFile,
  uploadController.uploadDocument
);

// ============================================
// ATTACHMENT ROUTES (for messages)
// ============================================

/**
 * @route   POST /api/v1/uploads/attachment
 * @desc    Upload a message attachment
 * @access  Private
 * @body    multipart/form-data with 'attachment' field
 */
router.post(
  '/attachment',
  auth,
  uploadAttachment,
  requireFile,
  uploadController.uploadAttachment
);

// ============================================
// PRE-SIGNED URL ROUTES
// ============================================

/**
 * @route   POST /api/v1/uploads/presigned-url
 * @desc    Get pre-signed URL for direct upload to S3
 * @access  Private
 * @body    { filename: string, mimetype: string, type: 'profile-photo' | 'pitch-deck' | 'document' | 'attachment' }
 */
router.post('/presigned-url', auth, uploadController.getPresignedUploadUrl);

// ============================================
// DELETE FILE ROUTE
// ============================================

/**
 * @route   DELETE /api/v1/uploads/file
 * @desc    Delete a file by URL
 * @access  Private
 * @body    { url: string }
 */
router.delete('/file', auth, uploadController.deleteFile);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
