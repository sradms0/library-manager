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
exports.route = function(req, res, next) {}

