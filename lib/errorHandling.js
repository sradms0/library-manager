'use strict';

/**
 * @module lib/errorHandling
*/

/**
 * Asynchronous function wrapper for routing
 * @param cb - the asynchronous function to be called
 * @return { (req, res, next) } - the wrapper function
*/
exports.asyncHandler = function(cb) {
  /**
     Wait for callback function and catch errors, calling error-middleware
   * @param req - the request object from a route
   * @param res - the resolve object from a route
   * @param next - the middleware for error handling
   *
  */
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      return next(error)
    }
  }
}
