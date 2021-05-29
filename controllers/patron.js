'use strict';

/**
 * @module controllers/patron
*/

const { patron: patronService } = require('$services');
const { 
  errorHandling: {assertFind, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');


/**
 * Reads all patrons and renders all books to '/views/patron/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {});
