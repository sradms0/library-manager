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
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('patrons', res, req);
  const renderConf = await readDataAndCreateRenderConf('patrons', patronService.readAll, req, '/patrons?');
  res.render('patron/index', renderConf);
});
