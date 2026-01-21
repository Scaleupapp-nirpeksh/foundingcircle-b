/**
 * @fileoverview Standardized API Response formatter
 * 
 * This class provides consistent response structure for all API endpoints.
 * All successful responses follow the same format for predictable frontend handling.
 * 
 * @module utils/ApiResponse
 */

/**
 * Standardized API Response class
 */
class ApiResponse {
    /**
     * Creates an ApiResponse instance
     * @param {number} statusCode - HTTP status code (e.g., 200, 201)
     * @param {string} message - Human-readable success message
     * @param {*} [data=null] - Response payload
     * @param {Object} [meta=null] - Additional metadata (pagination, counts, etc.)
     */
    constructor(statusCode, message, data = null, meta = null) {
      this.success = true;
      this.statusCode = statusCode;
      this.message = message;
      this.data = data;
      this.meta = meta;
      this.timestamp = new Date().toISOString();
    }
  
    /**
     * Converts response to JSON object
     * @returns {Object} Response as plain object
     */
    toJSON() {
      const response = {
        success: this.success,
        message: this.message,
      };
  
      // Only include data if it exists
      if (this.data !== null && this.data !== undefined) {
        response.data = this.data;
      }
  
      // Only include meta if it exists
      if (this.meta !== null && this.meta !== undefined) {
        response.meta = this.meta;
      }
  
      return response;
    }
  
    /**
     * Sends the response using Express res object
     * @param {Object} res - Express response object
     * @returns {Object} Express response
     */
    send(res) {
      return res.status(this.statusCode).json(this.toJSON());
    }
  
    // ============================================
    // STATIC FACTORY METHODS
    // ============================================
  
    /**
     * Creates a 200 OK response
     * @param {string} [message='Success'] - Success message
     * @param {*} [data=null] - Response data
     * @param {Object} [meta=null] - Additional metadata
     * @returns {ApiResponse}
     */
    static ok(message = 'Success', data = null, meta = null) {
      return new ApiResponse(200, message, data, meta);
    }
  
    /**
     * Creates a 201 Created response
     * @param {string} [message='Created successfully'] - Success message
     * @param {*} [data=null] - Created resource data
     * @returns {ApiResponse}
     */
    static created(message = 'Created successfully', data = null) {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates a 200 Updated response
     * @param {string} [message='Updated successfully'] - Success message
     * @param {*} [data=null] - Updated resource data
     * @returns {ApiResponse}
     */
    static updated(message = 'Updated successfully', data = null) {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates a 200 Deleted response
     * @param {string} [message='Deleted successfully'] - Success message
     * @returns {ApiResponse}
     */
    static deleted(message = 'Deleted successfully') {
      return new ApiResponse(200, message);
    }
  
    /**
     * Creates a 204 No Content response
     * @param {string} [message='No content'] - Success message
     * @returns {ApiResponse}
     */
    static noContent(message = 'No content') {
      return new ApiResponse(204, message);
    }
  
    // ============================================
    // AUTHENTICATION RESPONSES
    // ============================================
  
    /**
     * Creates a login success response
     * @param {Object} data - User data and tokens
     * @param {string} [message='Login successful'] - Success message
     * @returns {ApiResponse}
     */
    static loginSuccess(data, message = 'Login successful') {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates a registration success response
     * @param {Object} data - User data and tokens
     * @param {string} [message='Registration successful'] - Success message
     * @returns {ApiResponse}
     */
    static registerSuccess(data, message = 'Registration successful') {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates an OTP sent response
     * @param {Object} data - OTP details (expiresIn, etc.)
     * @param {string} [message='OTP sent successfully'] - Success message
     * @returns {ApiResponse}
     */
    static otpSent(data = null, message = 'OTP sent successfully') {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates an OTP verified response
     * @param {Object} data - Verification result data
     * @param {string} [message='OTP verified successfully'] - Success message
     * @returns {ApiResponse}
     */
    static otpVerified(data = null, message = 'OTP verified successfully') {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates a password reset success response
     * @param {string} [message='Password reset successfully'] - Success message
     * @returns {ApiResponse}
     */
    static passwordReset(message = 'Password reset successfully') {
      return new ApiResponse(200, message);
    }
  
    /**
     * Creates a token refresh success response
     * @param {Object} data - New tokens
     * @param {string} [message='Token refreshed successfully'] - Success message
     * @returns {ApiResponse}
     */
    static tokenRefreshed(data, message = 'Token refreshed successfully') {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates a logout success response
     * @param {string} [message='Logged out successfully'] - Success message
     * @returns {ApiResponse}
     */
    static logoutSuccess(message = 'Logged out successfully') {
      return new ApiResponse(200, message);
    }
  
    // ============================================
    // PAGINATED RESPONSES
    // ============================================
  
    /**
     * Creates a paginated response
     * @param {Array} data - Array of items
     * @param {Object} pagination - Pagination details
     * @param {number} pagination.page - Current page number
     * @param {number} pagination.limit - Items per page
     * @param {number} pagination.total - Total number of items
     * @param {number} pagination.totalPages - Total number of pages
     * @param {string} [message='Data retrieved successfully'] - Success message
     * @returns {ApiResponse}
     */
    static paginated(data, pagination, message = 'Data retrieved successfully') {
      const { page, limit, total, totalPages } = pagination;
      
      const meta = {
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
  
      return new ApiResponse(200, message, data, meta);
    }
  
    /**
     * Helper to calculate pagination metadata
     * @param {number} page - Current page (1-indexed)
     * @param {number} limit - Items per page
     * @param {number} total - Total items count
     * @returns {Object} Pagination object
     */
    static calculatePagination(page, limit, total) {
      const totalPages = Math.ceil(total / limit);
      
      return {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages,
      };
    }
  
    // ============================================
    // DOMAIN-SPECIFIC RESPONSES
    // ============================================
  
    /**
     * Creates a profile completed response
     * @param {Object} data - Profile data
     * @param {string} [message='Profile completed successfully'] - Success message
     * @returns {ApiResponse}
     */
    static profileCompleted(data, message = 'Profile completed successfully') {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates a match found response
     * @param {Object} data - Match data
     * @param {string} [message='Match found'] - Success message
     * @returns {ApiResponse}
     */
    static matchFound(data, message = 'Match found') {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates an interest expressed response
     * @param {Object} data - Interest data
     * @param {string} [message='Interest expressed successfully'] - Success message
     * @returns {ApiResponse}
     */
    static interestExpressed(data, message = 'Interest expressed successfully') {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates a shortlisted response
     * @param {Object} data - Shortlist data
     * @param {string} [message='Builder shortlisted successfully'] - Success message
     * @returns {ApiResponse}
     */
    static shortlisted(data, message = 'Builder shortlisted successfully') {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates a conversation created response
     * @param {Object} data - Conversation data
     * @param {string} [message='Conversation started'] - Success message
     * @returns {ApiResponse}
     */
    static conversationCreated(data, message = 'Conversation started') {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates a message sent response
     * @param {Object} data - Message data
     * @param {string} [message='Message sent'] - Success message
     * @returns {ApiResponse}
     */
    static messageSent(data, message = 'Message sent') {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates a trial proposed response
     * @param {Object} data - Trial data
     * @param {string} [message='Trial proposed successfully'] - Success message
     * @returns {ApiResponse}
     */
    static trialProposed(data, message = 'Trial proposed successfully') {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates a trial accepted response
     * @param {Object} data - Trial data
     * @param {string} [message='Trial accepted'] - Success message
     * @returns {ApiResponse}
     */
    static trialAccepted(data, message = 'Trial accepted') {
      return new ApiResponse(200, message, data);
    }
  
    /**
     * Creates a file uploaded response
     * @param {Object} data - Upload data (URL, fileId, etc.)
     * @param {string} [message='File uploaded successfully'] - Success message
     * @returns {ApiResponse}
     */
    static fileUploaded(data, message = 'File uploaded successfully') {
      return new ApiResponse(201, message, data);
    }
  
    /**
     * Creates an opening created response
     * @param {Object} data - Opening data
     * @param {string} [message='Opening created successfully'] - Success message
     * @returns {ApiResponse}
     */
    static openingCreated(data, message = 'Opening created successfully') {
      return new ApiResponse(201, message, data);
    }
  }
  
  module.exports = ApiResponse;