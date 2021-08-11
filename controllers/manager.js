'use strict';

/**
 * A single controller for the library-system interface.
 * @module controllers/manager
*/

/**
 * Sends default pagination configurtation for sub-root links, rendering /views/index
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/', home);
 *
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.home = function(req, res) {
  res.render('manager/index', { page: 1, limit: 10 });
}

