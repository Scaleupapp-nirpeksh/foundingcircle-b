/**
 * @fileoverview User Routes
 *
 * Defines all user-related API endpoints.
 *
 * @module routes/user
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const uploadController = require('../../upload/controllers/upload.controller');
const { auth, requireAdmin } = require('../../../shared/middleware/auth');
const { uploadProfilePhoto, requireFile } = require('../../../shared/middleware/upload');

// ============================================
// CURRENT USER ROUTES (Must be before /:id)
// ============================================

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics/counts
 * @access  Private (Admin only)
 */
router.get('/stats', auth, requireAdmin, userController.getUserStats);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user's profile with associated data
 * @access  Private
 */
router.get('/me', auth, userController.getMe);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user's basic info
 * @access  Private
 * @body    { name?, phone?, location?, avatarUrl?, timezone? }
 */
router.patch('/me', auth, userController.updateMe);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete current user's account (soft delete)
 * @access  Private
 */
router.delete('/me', auth, userController.deleteMe);

/**
 * @route   POST /api/v1/users/me/photo
 * @desc    Upload profile photo for current user
 * @access  Private
 * @body    multipart/form-data with 'profilePhoto' field
 */
router.post('/me/photo', auth, uploadProfilePhoto, requireFile, uploadController.uploadProfilePhoto);

/**
 * @route   DELETE /api/v1/users/me/photo
 * @desc    Delete profile photo for current user
 * @access  Private
 */
router.delete('/me/photo', auth, uploadController.deleteProfilePhoto);

// ============================================
// ADMIN USER MANAGEMENT ROUTES
// ============================================

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only)
 * @query   { userType?, status?, onboardingComplete?, search?, page?, limit?, sort? }
 */
router.get('/', auth, requireAdmin, userController.getUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or self)
 * @query   { includeProfile? }
 */
router.get('/:id', auth, userController.getUserById);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Update user status
 * @access  Private (Admin only)
 * @body    { status: 'active' | 'suspended' | 'banned', reason? }
 */
router.patch('/:id/status', auth, requireAdmin, userController.updateUserStatus);

/**
 * @route   POST /api/v1/users/:id/suspend
 * @desc    Suspend a user
 * @access  Private (Admin only)
 * @body    { reason? }
 */
router.post('/:id/suspend', auth, requireAdmin, userController.suspendUser);

/**
 * @route   POST /api/v1/users/:id/ban
 * @desc    Ban a user
 * @access  Private (Admin only)
 * @body    { reason? }
 */
router.post('/:id/ban', auth, requireAdmin, userController.banUser);

/**
 * @route   POST /api/v1/users/:id/reactivate
 * @desc    Reactivate a suspended/banned user
 * @access  Private (Admin only)
 */
router.post('/:id/reactivate', auth, requireAdmin, userController.reactivateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Hard delete a user (permanent)
 * @access  Private (Admin only)
 */
router.delete('/:id', auth, requireAdmin, userController.deleteUser);

// ============================================
// EXPORTS
// ============================================

module.exports = router;
