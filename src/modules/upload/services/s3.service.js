/**
 * @fileoverview AWS S3 Service
 *
 * Handles all S3 operations:
 * - File uploads (profile photos, pitch decks, documents)
 * - File deletions
 * - Pre-signed URL generation
 *
 * @module services/s3
 */

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const { config } = require('../../../shared/config');
const ApiError = require('../../../shared/utils/ApiError');

// ============================================
// S3 CLIENT INITIALIZATION
// ============================================

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const BUCKET_NAME = config.aws.s3Bucket;

// ============================================
// UPLOAD FOLDER PATHS
// ============================================

const UPLOAD_PATHS = {
  PROFILE_PHOTOS: 'profile-photos',
  PITCH_DECKS: 'pitch-decks',
  DOCUMENTS: 'documents',
  ATTACHMENTS: 'attachments',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generates a unique filename with original extension
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID for namespacing
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName, userId) => {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const uniqueId = uuidv4().slice(0, 8);
  return `${userId}-${timestamp}-${uniqueId}${ext}`;
};

/**
 * Constructs the full S3 key (path)
 * @param {string} folder - Upload folder path
 * @param {string} filename - File name
 * @returns {string} Full S3 key
 */
const constructS3Key = (folder, filename) => {
  return `${folder}/${filename}`;
};

/**
 * Gets the public URL for an S3 object
 * @param {string} key - S3 object key
 * @returns {string} Public URL
 */
const getPublicUrl = (key) => {
  return `https://${BUCKET_NAME}.s3.${config.aws.region}.amazonaws.com/${key}`;
};

/**
 * Extracts S3 key from a full S3 URL
 * @param {string} url - Full S3 URL
 * @returns {string|null} S3 key or null if invalid URL
 */
const extractKeyFromUrl = (url) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    return urlObj.pathname.slice(1);
  } catch {
    return null;
  }
};

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Uploads a file to S3
 *
 * @param {Object} options - Upload options
 * @param {Buffer} options.buffer - File buffer
 * @param {string} options.originalName - Original filename
 * @param {string} options.mimetype - File MIME type
 * @param {string} options.userId - User ID
 * @param {string} options.folder - Upload folder (from UPLOAD_PATHS)
 *
 * @returns {Promise<Object>} Upload result with URL and key
 * @throws {ApiError} If upload fails
 */
const uploadFile = async ({ buffer, originalName, mimetype, userId, folder }) => {
  try {
    const filename = generateUniqueFilename(originalName, userId);
    const key = constructS3Key(folder, filename);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      // Note: ACL removed - use S3 bucket policy for public access instead
      // Or use CloudFront for serving files
    });

    await s3Client.send(command);

    const url = getPublicUrl(key);

    return {
      url,
      key,
      filename,
      mimetype,
      size: buffer.length,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw ApiError.fileUploadFailed('Failed to upload file to S3');
  }
};

/**
 * Uploads a profile photo
 *
 * @param {Object} options - Upload options
 * @param {Buffer} options.buffer - Image buffer
 * @param {string} options.originalName - Original filename
 * @param {string} options.mimetype - Image MIME type
 * @param {string} options.userId - User ID
 *
 * @returns {Promise<Object>} Upload result
 */
const uploadProfilePhoto = async ({ buffer, originalName, mimetype, userId }) => {
  return uploadFile({
    buffer,
    originalName,
    mimetype,
    userId,
    folder: UPLOAD_PATHS.PROFILE_PHOTOS,
  });
};

/**
 * Uploads a pitch deck document
 *
 * @param {Object} options - Upload options
 * @param {Buffer} options.buffer - Document buffer
 * @param {string} options.originalName - Original filename
 * @param {string} options.mimetype - Document MIME type
 * @param {string} options.userId - User ID
 *
 * @returns {Promise<Object>} Upload result
 */
const uploadPitchDeck = async ({ buffer, originalName, mimetype, userId }) => {
  return uploadFile({
    buffer,
    originalName,
    mimetype,
    userId,
    folder: UPLOAD_PATHS.PITCH_DECKS,
  });
};

/**
 * Uploads a message attachment
 *
 * @param {Object} options - Upload options
 * @param {Buffer} options.buffer - File buffer
 * @param {string} options.originalName - Original filename
 * @param {string} options.mimetype - File MIME type
 * @param {string} options.userId - User ID
 *
 * @returns {Promise<Object>} Upload result
 */
const uploadAttachment = async ({ buffer, originalName, mimetype, userId }) => {
  return uploadFile({
    buffer,
    originalName,
    mimetype,
    userId,
    folder: UPLOAD_PATHS.ATTACHMENTS,
  });
};

/**
 * Uploads a general document
 *
 * @param {Object} options - Upload options
 * @param {Buffer} options.buffer - Document buffer
 * @param {string} options.originalName - Original filename
 * @param {string} options.mimetype - Document MIME type
 * @param {string} options.userId - User ID
 *
 * @returns {Promise<Object>} Upload result
 */
const uploadDocument = async ({ buffer, originalName, mimetype, userId }) => {
  return uploadFile({
    buffer,
    originalName,
    mimetype,
    userId,
    folder: UPLOAD_PATHS.DOCUMENTS,
  });
};

// ============================================
// DELETE FUNCTIONS
// ============================================

/**
 * Deletes a file from S3
 *
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} True if deleted successfully
 */
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    // Don't throw - deletion failures shouldn't break the flow
    return false;
  }
};

/**
 * Deletes a file from S3 using its URL
 *
 * @param {string} url - Full S3 URL
 * @returns {Promise<boolean>} True if deleted successfully
 */
const deleteFileByUrl = async (url) => {
  const key = extractKeyFromUrl(url);
  if (!key) return false;
  return deleteFile(key);
};

// ============================================
// PRE-SIGNED URL FUNCTIONS
// ============================================

/**
 * Generates a pre-signed URL for downloading a file
 *
 * @param {string} key - S3 object key
 * @param {number} [expiresIn=3600] - URL expiration time in seconds (default 1 hour)
 * @returns {Promise<string>} Pre-signed URL
 */
const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw ApiError.internal('Failed to generate download URL');
  }
};

/**
 * Generates a pre-signed URL for uploading a file directly
 *
 * @param {Object} options - Options
 * @param {string} options.filename - Desired filename
 * @param {string} options.mimetype - File MIME type
 * @param {string} options.userId - User ID
 * @param {string} options.folder - Upload folder
 * @param {number} [options.expiresIn=600] - URL expiration time in seconds (default 10 min)
 *
 * @returns {Promise<Object>} Pre-signed URL and key
 */
const getSignedUploadUrl = async ({ filename, mimetype, userId, folder, expiresIn = 600 }) => {
  try {
    const uniqueFilename = generateUniqueFilename(filename, userId);
    const key = constructS3Key(folder, uniqueFilename);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimetype,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl: signedUrl,
      key,
      publicUrl: getPublicUrl(key),
      expiresIn,
    };
  } catch (error) {
    console.error('S3 signed upload URL error:', error);
    throw ApiError.internal('Failed to generate upload URL');
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Upload functions
  uploadFile,
  uploadProfilePhoto,
  uploadPitchDeck,
  uploadAttachment,
  uploadDocument,

  // Delete functions
  deleteFile,
  deleteFileByUrl,

  // Pre-signed URL functions
  getSignedDownloadUrl,
  getSignedUploadUrl,

  // Helpers (exported for testing)
  extractKeyFromUrl,
  getPublicUrl,

  // Constants
  UPLOAD_PATHS,
};
