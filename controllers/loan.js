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

/**
 * Reads one loan by primary key and renders loan to '/views/loan/update'.
 * Sets `res.status` to 404 when a loan is not found.
 *
*/
exports.readByPk = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  res.render('loan/update', { dataValues: loan });
});

/**
 * Reads one loan by primary key and renders loan to '/views/loan/return' for return confirmation.
 * Sets `res.status` to 404 when a loan is not found.
*/
exports.readReturn = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  res.render('loan/return', { dataValues: loan });
});
