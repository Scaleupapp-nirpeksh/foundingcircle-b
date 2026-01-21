/**
 * @fileoverview Request validation middleware using Joi
 * 
 * Provides middleware for validating request body, params, and query.
 * Returns detailed validation errors.
 * 
 * @module middleware/validate
 */

const Joi = require('joi');
const { AppError } = require('./errorHandler');
const { ERROR_CODES } = require('../constants');

// ============================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================

/**
 * Create validation middleware for request data
 * 
 * @param {Object} schema - Joi schema object with body, params, query keys
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.abortEarly=false] - Stop on first error
 * @param {boolean} [options.stripUnknown=true] - Remove unknown fields
 * @returns {Function} Express middleware function
 * 
 * @example
 * const schema = {
 *   body: Joi.object({
 *     email: Joi.string().email().required(),
 *     password: Joi.string().min(8).required(),
 *   }),
 *   params: Joi.object({
 *     id: Joi.string().hex().length(24).required(),
 *   }),
 * };
 * 
 * router.post('/users/:id', validate(schema), createUser);
 */
const validate = (schema, options = {}) => {
  const {
    abortEarly = false,
    stripUnknown = true,
  } = options;

  return async (req, res, next) => {
    const validationErrors = {};

    // Validate each part of the request
    const parts = ['body', 'params', 'query'];

    for (const part of parts) {
      if (schema[part]) {
        const { error, value } = schema[part].validate(req[part], {
          abortEarly,
          stripUnknown,
          errors: {
            wrap: {
              label: false,
            },
          },
        });

        if (error) {
          // Collect errors for this part
          validationErrors[part] = error.details.reduce((acc, detail) => {
            const key = detail.path.join('.');
            acc[key] = {
              message: detail.message,
              type: detail.type,
              value: detail.context?.value,
            };
            return acc;
          }, {});
        } else {
          // Replace request data with validated/sanitized data
          req[part] = value;
        }
      }
    }

    // If there are validation errors, return them
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = [];
      
      Object.entries(validationErrors).forEach(([part, errors]) => {
        Object.entries(errors).forEach(([field, error]) => {
          errorMessages.push(`${field}: ${error.message}`);
        });
      });

      return next(
        AppError.validationError(
          `Validation failed: ${errorMessages.join(', ')}`,
          validationErrors
        )
      );
    }

    next();
  };
};

// ============================================
// COMMON JOI SCHEMAS
// ============================================

/**
 * Common Joi validation schemas for reuse
 */
const schemas = {
  // MongoDB ObjectId
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),

  // Email
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(255)
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 255 characters',
    }),

  // Password (min 8 chars, at least one uppercase, lowercase, number)
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),

  // Simple password (just min length)
  simplePassword: Joi.string()
    .min(8)
    .max(128)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
    }),

  // Name
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
    }),

  // Phone (E.164 format)
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Phone must be in E.164 format (e.g., +919876543210)',
    }),

  // URL
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .max(500)
    .messages({
      'string.uri': 'Please provide a valid URL',
      'string.max': 'URL must not exceed 500 characters',
    }),

  // Pagination
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),

  // Sort order
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be "asc" or "desc"',
    }),

  // Date
  date: Joi.date()
    .iso()
    .messages({
      'date.format': 'Please provide a valid ISO date',
    }),

  // Percentage (0-100)
  percentage: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.min': 'Value must be at least 0',
      'number.max': 'Value must not exceed 100',
    }),

  // Hours per week (5-80)
  hoursPerWeek: Joi.number()
    .integer()
    .min(5)
    .max(80)
    .messages({
      'number.min': 'Hours must be at least 5',
      'number.max': 'Hours must not exceed 80',
    }),

  // Skills array
  skills: Joi.array()
    .items(Joi.string().trim().max(50))
    .min(1)
    .max(20)
    .messages({
      'array.min': 'At least one skill is required',
      'array.max': 'Maximum 20 skills allowed',
    }),

  // Intent statement
  intentStatement: Joi.string()
    .trim()
    .min(10)
    .max(300)
    .messages({
      'string.min': 'Intent statement must be at least 10 characters',
      'string.max': 'Intent statement must not exceed 300 characters',
    }),

  // Boolean that accepts string 'true'/'false'
  booleanString: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ),
};

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

/**
 * Pagination query schema
 */
const paginationSchema = Joi.object({
  page: schemas.page,
  limit: schemas.limit,
  sort: Joi.string().max(50),
  order: schemas.sortOrder,
});

/**
 * ID parameter schema
 */
const idParamSchema = Joi.object({
  id: schemas.objectId.required(),
});

/**
 * User ID parameter schema
 */
const userIdParamSchema = Joi.object({
  userId: schemas.objectId.required(),
});

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize string - trim and remove dangerous characters
 * 
 * @param {string} value - Input value
 * @returns {string} Sanitized value
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/\$/g, ''); // Remove MongoDB operator prefix
};

/**
 * Custom Joi extension for sanitization
 */
const sanitizedString = Joi.string().custom((value, helpers) => {
  return sanitizeString(value);
});

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

/**
 * Validate data against a schema (not as middleware)
 * Useful for validating data in services
 * 
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @param {Object} [options] - Validation options
 * @returns {Object} { isValid, value, errors }
 * 
 * @example
 * const { isValid, value, errors } = validateData(userData, userSchema);
 * if (!isValid) {
 *   throw AppError.validationError('Invalid data', errors);
 * }
 */
const validateData = (data, schema, options = {}) => {
  const {
    abortEarly = false,
    stripUnknown = true,
  } = options;

  const { error, value } = schema.validate(data, {
    abortEarly,
    stripUnknown,
    errors: {
      wrap: {
        label: false,
      },
    },
  });

  if (error) {
    const errors = error.details.reduce((acc, detail) => {
      const key = detail.path.join('.');
      acc[key] = {
        message: detail.message,
        type: detail.type,
      };
      return acc;
    }, {});

    return { isValid: false, value: null, errors };
  }

  return { isValid: true, value, errors: null };
};

/**
 * Create a conditional required field
 * Field is required only when condition is met
 * 
 * @param {string} field - Field name to check
 * @param {*} value - Value that triggers requirement
 * @returns {Object} Joi when() configuration
 */
const requiredWhen = (field, value) => ({
  is: value,
  then: Joi.required(),
  otherwise: Joi.optional(),
});

// ============================================
// CUSTOM VALIDATORS
// ============================================

/**
 * Validate MongoDB ObjectId
 * 
 * @param {string} value - Value to validate
 * @param {Object} helpers - Joi helpers
 * @returns {string} Value if valid
 */
const validateObjectId = (value, helpers) => {
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

/**
 * Validate enum value
 * 
 * @param {Object} enumObj - Enum object from constants
 * @returns {Joi.Schema} Joi schema for enum validation
 * 
 * @example
 * const schema = Joi.object({
 *   status: validateEnum(USER_STATUS),
 * });
 */
const validateEnum = (enumObj) => {
  const values = Object.values(enumObj);
  return Joi.string()
    .valid(...values)
    .messages({
      'any.only': `Must be one of: ${values.join(', ')}`,
    });
};

/**
 * Validate array of enum values
 * 
 * @param {Object} enumObj - Enum object from constants
 * @param {Object} [options] - Options
 * @param {number} [options.min] - Minimum items
 * @param {number} [options.max] - Maximum items
 * @returns {Joi.Schema} Joi schema
 */
const validateEnumArray = (enumObj, options = {}) => {
  const { min = 1, max = 10 } = options;
  const values = Object.values(enumObj);
  
  return Joi.array()
    .items(Joi.string().valid(...values))
    .min(min)
    .max(max)
    .messages({
      'array.min': `At least ${min} item(s) required`,
      'array.max': `Maximum ${max} items allowed`,
      'any.only': `Items must be from: ${values.join(', ')}`,
    });
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Main middleware
  validate,
  
  // Common schemas
  schemas,
  paginationSchema,
  idParamSchema,
  userIdParamSchema,
  
  // Helpers
  validateData,
  sanitizeString,
  sanitizedString,
  requiredWhen,
  
  // Custom validators
  validateObjectId,
  validateEnum,
  validateEnumArray,
  
  // Re-export Joi for convenience
  Joi,
};