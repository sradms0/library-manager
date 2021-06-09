'use strict';

/**
 * @module controllers/manager
*/

/**
 * Sends default pagination configurtation for sub-root links, rendering /views/index
*/
exports.home = function(req, res) {
  res.render('index', { page: 1, limit: 10 });
}

