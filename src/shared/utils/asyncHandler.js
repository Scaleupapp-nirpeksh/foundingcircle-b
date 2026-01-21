/**
 * @fileoverview Async handler wrapper for Express route handlers
 * 
 * This utility wraps async route handlers to automatically catch errors
 * and forward them to Express error handling middleware.
 * 
 * @module utils/asyncHandler
 */

/**
 * Wraps an async function to catch errors and pass them to next()
 * 
 * @param {Function} fn - Async function to wrap (req, res, next) => Promise
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Instead of:
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * 
 * // Use:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
    // Return a function that Express can use as middleware
    return (req, res, next) => {
      // Execute the async function and catch any errors
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  
  /**
   * Alternative implementation using async/await syntax
   * (Functionally equivalent to above, just different style)
   * 
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Express middleware function
   */
  const asyncHandlerAlt = (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  };
  
  /**
   * Wraps multiple middleware functions with asyncHandler
   * Useful for routes that have multiple async middleware
   * 
   * @param {...Function} fns - Async functions to wrap
   * @returns {Function[]} Array of wrapped middleware functions
   * 
   * @example
   * router.post('/users',
   *   ...asyncHandlerAll(validateUser, checkDuplicates, createUser)
   * );
   */
  const asyncHandlerAll = (...fns) => {
    return fns.map((fn) => asyncHandler(fn));
  };
  
  /**
   * Creates an async handler with a custom error transformer
   * Useful when you want to transform errors before they reach the error handler
   * 
   * @param {Function} fn - Async function to wrap
   * @param {Function} errorTransformer - Function to transform errors
   * @returns {Function} Express middleware function
   * 
   * @example
   * const handler = asyncHandlerWithTransform(
   *   async (req, res) => {
   *     // ... handler logic
   *   },
   *   (error) => {
   *     if (error.code === 11000) {
   *       return ApiError.conflict('Duplicate entry');
   *     }
   *     return error;
   *   }
   * );
   */
  const asyncHandlerWithTransform = (fn, errorTransformer) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        const transformedError = errorTransformer(error);
        next(transformedError);
      });
    };
  };
  
  module.exports = {
    asyncHandler,
    asyncHandlerAlt,
    asyncHandlerAll,
    asyncHandlerWithTransform,
  };