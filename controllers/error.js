'use strict';

/**
 * Error-handling controller that manages non-existent routing and server related errors.
 * @module controllers/error
*/

/**
 * Handles invalid route-nagivation.
 * An error is created with a 404 status code and is passed to the `next` middleware.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
 * @param {Function}  next - The middleware to call; meant for global error handler.
*/
exports.route = function(req, res, next) {
  const error = new Error('Page Not Found');
  error.status = 404;
  return next(error);
}

/**
 * Handles all errors, setting an error.status code if there is none.
 * `res.status` is set to error.status and view/error is then rendered.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @param {Error}     error - the error object to assess.
 * @param {Request}   req   - The request object from a route.
 * @param {Response}  res   - The resolve object from a route.
 * @param {Function}  next  - The middleware called before this function.
*/
exports.global = function(error, req, res, next) {
  error.status = error.status || 500;
  res.status(error.status).render('error', { error });
}

