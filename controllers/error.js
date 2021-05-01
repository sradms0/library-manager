'use strict';

/**
 * @module controllers/error
*/

/**
 * Handles invalid route-nagivation.
 * An error is created with a 404 status code and is passed to the `next` middleware.
 * @param { Object } req - routing request object.
 * @param { Object } res - routing response object.
 * @param { Function } next - to call the next middleware (meant for global error handler).
*/
exports.route = function(req, res, next) {
  const error = new Error('Page Not Found');
  error.status = 404;
  return next(error);
}

/**
 * Handles all errors, setting an error.status code if there is none.
 * `res.status` is set to error.status and view/error is then rendered.
 * @param { Object } error - the error object to assess.
 * @param { Object } req - routing request object.
 * @param { Object } res - routing response object.
 * @param { Function } next - the middleware called before this function.
*/
exports.global = function(error, req, res, next) {
  error.status = error.status || 500;
  res.status(error.status).render('error', { error });
}

