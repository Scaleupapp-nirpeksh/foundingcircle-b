/**
 * @fileoverview File Upload Middleware
 *
 * Provides multer-based file upload middleware with:
 * - File type validation
 * - File size limits
 * - Memory storage (for S3 upload)
 *
 * @module middleware/upload
 */

const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { config } = require('../config');

// ============================================
// STORAGE CONFIGURATION
// ============================================

/**
 * Memory storage - files are stored as buffers in memory
 * This is efficient for immediate S3 upload
 */
const storage = multer.memoryStorage();

// ============================================
// FILE FILTER FUNCTIONS
// ============================================

/**
 * Creates a file filter for specific MIME types
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {Function} Multer file filter function
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        ApiError.invalidFileType(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        ),
        false
      );
    }
  };
};

/**
 * Image file filter - allows JPEG, PNG, WebP
 */
const imageFilter = createFileFilter(config.upload.allowedImageTypes);

/**
 * Document file filter - allows PDF
 */
const documentFilter = createFileFilter(config.upload.allowedDocTypes);

/**
 * Combined filter for images and documents
 */
const imageAndDocFilter = createFileFilter([
  ...config.upload.allowedImageTypes,
  ...config.upload.allowedDocTypes,
]);

/**
 * Attachment filter - allows images, PDFs, and common document types
 */
const attachmentFilter = createFileFilter([
  ...config.upload.allowedImageTypes,
  ...config.upload.allowedDocTypes,
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

// ============================================
// UPLOAD MIDDLEWARE FACTORIES
// ============================================

/**
 * Profile photo upload middleware
 * - Single file upload
 * - Max 5MB
 * - Images only (JPEG, PNG, WebP)
 */
const uploadProfilePhoto = multer({
  storage,
  limits: {
    fileSize: config.upload.maxProfilePhotoSize,
  },
  fileFilter: imageFilter,
}).single('profilePhoto');

/**
 * Pitch deck upload middleware
 * - Single file upload
 * - Max 50MB
 * - PDF only
 */
const uploadPitchDeck = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for pitch decks
  },
  fileFilter: documentFilter,
}).single('pitchDeck');

/**
 * General document upload middleware
 * - Single file upload
 * - Max 10MB
 * - PDF only
 */
const uploadDocument = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: documentFilter,
}).single('document');

/**
 * Message attachment upload middleware
 * - Single file upload
 * - Max 25MB
 * - Images, PDFs, and common document types
 */
const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB for attachments
  },
  fileFilter: attachmentFilter,
}).single('attachment');

/**
 * Multiple images upload middleware
 * - Up to 5 files
 * - Max 5MB each
 * - Images only
 */
const uploadMultipleImages = multer({
  storage,
  limits: {
    fileSize: config.upload.maxProfilePhotoSize,
  },
  fileFilter: imageFilter,
}).array('images', 5);

// ============================================
// ERROR HANDLING WRAPPER
// ============================================

/**
 * Wraps multer middleware to handle errors properly
 * @param {Function} uploadMiddleware - Multer middleware
 * @returns {Function} Express middleware
 */
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        // Handle multer-specific errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(ApiError.fileTooLarge('File size exceeds the limit'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(ApiError.badRequest('Too many files uploaded'));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(ApiError.badRequest(`Unexpected field: ${err.field}`));
          }
          return next(ApiError.badRequest(err.message));
        }

        // Handle our custom ApiError
        if (err instanceof ApiError) {
          return next(err);
        }

        // Handle unknown errors
        return next(ApiError.fileUploadFailed('File upload failed'));
      }

      next();
    });
  };
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Middleware to ensure a file was uploaded
 * Use after upload middleware
 */
const requireFile = (req, res, next) => {
  if (!req.file) {
    return next(ApiError.badRequest('No file uploaded'));
  }
  next();
};

/**
 * Middleware to ensure files were uploaded (for multiple files)
 * Use after upload middleware
 */
const requireFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(ApiError.badRequest('No files uploaded'));
  }
  next();
};

/**
 * Optional file middleware - doesn't error if no file
 * Just continues to next middleware
 */
const optionalFile = (req, res, next) => {
  // File is optional, just continue
  next();
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Pre-configured upload middleware
  uploadProfilePhoto: handleUpload(uploadProfilePhoto),
  uploadPitchDeck: handleUpload(uploadPitchDeck),
  uploadDocument: handleUpload(uploadDocument),
  uploadAttachment: handleUpload(uploadAttachment),
  uploadMultipleImages: handleUpload(uploadMultipleImages),

  // Validation helpers
  requireFile,
  requireFiles,
  optionalFile,

  // For custom configurations
  handleUpload,
  createFileFilter,
  storage,
};
