'use strict';

/**
 * @module controllers/loan
*/

const { loan: loanService } = require('$services');
const { 
  errorHandling: {assertFind, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');


/**
 * Reads all loans and renders all loans to '/views/loan/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('loans', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readAll, req, '/loans?');
  res.render('loan/index', renderConf);
});
