/**
 * @fileoverview Upload Controller
 *
 * Handles file upload endpoints:
 * - Profile photo upload
 * - Pitch deck upload
 * - Document upload
 * - Attachment upload
 * - Pre-signed URL generation
 *
 * @module controllers/upload
 */

const s3Service = require('../services/s3.service');
const userService = require('../../user/services/user.service');
const profileService = require('../../profile/services/profile.service');
const { ApiResponse, asyncHandler } = require('../../../shared/utils');

// ============================================
// PROFILE PHOTO UPLOAD
// ============================================

/**
 * Upload profile photo for current user
 *
 * @route POST /api/v1/uploads/profile-photo
 * @access Private
 *
 * @returns {Object} Uploaded file URL
 */
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get existing profile photo URL to delete old one
  const user = await userService.getUserById(userId);
  const oldPhotoUrl = user?.profilePhoto;

  // Upload new photo
  const result = await s3Service.uploadProfilePhoto({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    userId: userId.toString(),
  });

  // Update user profile with new photo URL
  await userService.updateUser(userId, { profilePhoto: result.url });

  // Delete old photo if exists (don't await - fire and forget)
  if (oldPhotoUrl) {
    s3Service.deleteFileByUrl(oldPhotoUrl).catch(() => {});
  }

  return ApiResponse.created('Profile photo uploaded successfully', {
    url: result.url,
    filename: result.filename,
    size: result.size,
  }).send(res);
});

/**
 * Delete profile photo for current user
 *
 * @route DELETE /api/v1/uploads/profile-photo
 * @access Private
 *
 * @returns {Object} Success message
 */
const deleteProfilePhoto = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get existing profile photo URL
  const user = await userService.getUserById(userId);
  const photoUrl = user?.profilePhoto;

  if (!photoUrl) {
    return ApiResponse.ok('No profile photo to delete').send(res);
  }

  // Delete from S3
  await s3Service.deleteFileByUrl(photoUrl);

  // Remove URL from user profile
  await userService.updateUser(userId, { profilePhoto: null });

  return ApiResponse.ok('Profile photo deleted successfully').send(res);
});

// ============================================
// PITCH DECK UPLOAD
// ============================================

/**
 * Upload pitch deck for founder profile
 *
 * @route POST /api/v1/uploads/pitch-deck
 * @access Private (Founders only)
 *
 * @returns {Object} Uploaded file URL
 */
const uploadPitchDeck = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get existing pitch deck URL to delete old one
  const profile = await profileService.getFounderProfile(userId);
  const oldPitchDeckUrl = profile?.socialLinks?.pitchDeck;

  // Upload new pitch deck
  const result = await s3Service.uploadPitchDeck({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    userId: userId.toString(),
  });

  // Update founder profile with new pitch deck URL
  await profileService.updateFounderProfile(userId, {
    socialLinks: {
      ...profile?.socialLinks,
      pitchDeck: result.url,
    },
  });

  // Delete old pitch deck if exists (don't await - fire and forget)
  if (oldPitchDeckUrl) {
    s3Service.deleteFileByUrl(oldPitchDeckUrl).catch(() => {});
  }

  return ApiResponse.created('Pitch deck uploaded successfully', {
    url: result.url,
    filename: result.filename,
    size: result.size,
  }).send(res);
});

/**
 * Delete pitch deck for founder profile
 *
 * @route DELETE /api/v1/uploads/pitch-deck
 * @access Private (Founders only)
 *
 * @returns {Object} Success message
 */
const deletePitchDeck = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get existing pitch deck URL
  const profile = await profileService.getFounderProfile(userId);
  const pitchDeckUrl = profile?.socialLinks?.pitchDeck;

  if (!pitchDeckUrl) {
    return ApiResponse.ok('No pitch deck to delete').send(res);
  }

  // Delete from S3
  await s3Service.deleteFileByUrl(pitchDeckUrl);

  // Remove URL from founder profile
  await profileService.updateFounderProfile(userId, {
    socialLinks: {
      ...profile?.socialLinks,
      pitchDeck: null,
    },
  });

  return ApiResponse.ok('Pitch deck deleted successfully').send(res);
});

// ============================================
// DOCUMENT UPLOAD
// ============================================

/**
 * Upload a general document
 *
 * @route POST /api/v1/uploads/document
 * @access Private
 *
 * @returns {Object} Uploaded file URL
 */
const uploadDocument = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await s3Service.uploadDocument({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    userId: userId.toString(),
  });

  return ApiResponse.created('Document uploaded successfully', {
    url: result.url,
    filename: result.filename,
    size: result.size,
  }).send(res);
});

// ============================================
// ATTACHMENT UPLOAD (for messages)
// ============================================

/**
 * Upload a message attachment
 *
 * @route POST /api/v1/uploads/attachment
 * @access Private
 *
 * @returns {Object} Uploaded file URL and metadata
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await s3Service.uploadAttachment({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    userId: userId.toString(),
  });

  // Determine attachment type
  let attachmentType = 'file';
  if (req.file.mimetype.startsWith('image/')) {
    attachmentType = 'image';
  } else if (req.file.mimetype === 'application/pdf') {
    attachmentType = 'document';
  }

  return ApiResponse.created('Attachment uploaded successfully', {
    url: result.url,
    filename: result.filename,
    originalName: req.file.originalname,
    size: result.size,
    mimetype: req.file.mimetype,
    attachmentType,
  }).send(res);
});

// ============================================
// PRE-SIGNED URLS
// ============================================

/**
 * Get pre-signed URL for direct upload
 *
 * @route POST /api/v1/uploads/presigned-url
 * @access Private
 *
 * @body {string} filename - Desired filename
 * @body {string} mimetype - File MIME type
 * @body {string} type - Upload type (profile-photo, pitch-deck, document, attachment)
 *
 * @returns {Object} Pre-signed upload URL
 */
const getPresignedUploadUrl = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { filename, mimetype, type } = req.body;

  // Map type to folder
  const folderMap = {
    'profile-photo': s3Service.UPLOAD_PATHS.PROFILE_PHOTOS,
    'pitch-deck': s3Service.UPLOAD_PATHS.PITCH_DECKS,
    document: s3Service.UPLOAD_PATHS.DOCUMENTS,
    attachment: s3Service.UPLOAD_PATHS.ATTACHMENTS,
  };

  const folder = folderMap[type];
  if (!folder) {
    throw ApiError.badRequest('Invalid upload type');
  }

  const result = await s3Service.getSignedUploadUrl({
    filename,
    mimetype,
    userId: userId.toString(),
    folder,
  });

  return ApiResponse.ok('Pre-signed URL generated', result).send(res);
});

/**
 * Delete a file by URL
 *
 * @route DELETE /api/v1/uploads/file
 * @access Private
 *
 * @body {string} url - File URL to delete
 *
 * @returns {Object} Success message
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    throw ApiError.badRequest('URL is required');
  }

  const deleted = await s3Service.deleteFileByUrl(url);

  if (deleted) {
    return ApiResponse.ok('File deleted successfully').send(res);
  } else {
    return ApiResponse.ok('File not found or already deleted').send(res);
  }
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Profile photo
  uploadProfilePhoto,
  deleteProfilePhoto,

  // Pitch deck
  uploadPitchDeck,
  deletePitchDeck,

  // Document
  uploadDocument,

  // Attachment
  uploadAttachment,

  // Pre-signed URLs
  getPresignedUploadUrl,

  // Delete
  deleteFile,
};
