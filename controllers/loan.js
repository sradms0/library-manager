'use strict';

/**
 * @module controllers/loan
*/

const { 
  book: bookService,
  loan: loanService,
  patron: patronService 
} = require('$services');

const { 
  errorHandling: {assertFind, assertLoanReturn, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');


/**
 * Helper to add Book and Patron associations 
 * and all Book and Patron instances for creating or updating after validation-errors occur.
 * @param {object} [associationIds] - associative ids of a loan.
 * @param {number} associationIds.book_id - associative id of loans book.
 * @param {number} associationIds.patron_id - associative id of loans patron.
 * @returns {object} the loans associated book and patron, and access to all books and patrons.
*/
async function createUpdateValErrBuild({ body: {book_id, patron_id} }) { 
  return {
    Book: book_id ? await bookService.readByPk(book_id) : null,
    Patron: patron_id ? await patronService.readByPk(patron_id) : null,
    books: (await bookService.readAll()).rows, 
    patrons:  (await patronService.readAll()).rows
  }
}

/**
 * Helper to add Book and Patron associations after validation-errors occur.
 * @param {object} [associationIds] - associative ids of a loan.
 * @param {number} associationIds.book_id - associative id of loans book.
 * @param {number} associationIds.patron_id - associative id of loans patron.
 * @returns {object} the loans associated book and patron.
 */
async function returnValErrBuild({ body: {book_id, patron_id} }) {
  return {
    Book: await bookService.readByPk(book_id),
    Patron: await patronService.readByPk(patron_id)
  }
}


/**
 * Creates a new loan
*/
exports.create = asyncHandler(async function(req, res) {
  const { body } = req;
  await loanService.create(body);
  res.redirect('/loans/all?page=1&limit=10');
}, { 
  errorView: 'loan/new', 
  model: bookService.model, 
  addToBuild: createUpdateValErrBuild
});

/**
 * Deletes a loan
*/
exports.delete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  await loanService.delete(loan);
  res.redirect('/loans/all?page=1&limit=10');
});

/**
 * Reads all loans and renders all loans to '/views/loan/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('loans/all', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readAll, req, '/loans/all?');
  res.render('loan/index', renderConf);
});


/**
 * Reads Loans by attribute values based on querystring and renders matches to '/views/loan/index'.
 *
*/
exports.readByAttrs = asyncHandler(async function(req, res) {});

/**
 * Reads all checked-out loans and renders all checked-out loans to '/views/loan/index'
 *
*/
exports.readCheckedOut = asyncHandler(async function(req, res) {
  assertParams('loans/checked-out', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readCheckedOut, req, '/loans/checked-out?');
  res.render('loan/index', renderConf);
});

/**
 * Reads one loan by primary key and renders loan to '/views/loan/delete' for deletion confirmation.
 * Sets `res.status` to 404 when a loan is not found.
 *
*/
exports.readDelete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  res.render('loan/delete', { dataValues: loan });
});

/**
 * Reads a new loan, rendering '/views/loan/new'
*/
exports.readNew = asyncHandler(async function(req, res) {
  const attrs = Object.keys(loanService.model.tableAttributes);
  const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {});

  const { rows: books } = await bookService.readAll(),
        { rows: patrons } = await patronService.readAll();

  dataValues.loaned_on = new Date();
  dataValues.return_by = new Date(dataValues.loaned_on.getTime()+(7*8.64e+7));
  dataValues.books = books;
  dataValues.patrons = patrons;

  res.render('loan/new', { dataValues });
});

/**
 * Reads all overdue loans and renders all loans to '/views/loan/index'
 *
*/
exports.readOverdue = asyncHandler(async function(req, res) {
  assertParams('loans/overdue', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readOverdue, req, '/loans/overdue?');
  res.render('loan/index', renderConf);
});

/**
 * Reads one loan by primary key and renders loan to '/views/loan/update'.
 * Sets `res.status` to 404 when a loan is not found.
 *
*/
exports.readByPk = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan =  await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);

  const { rows: books } = await bookService.readAll(),
        { rows: patrons } = await patronService.readAll();
  loan.books = books;
  loan.patrons = patrons;

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
  assertLoanReturn(loan)
  res.render('loan/return', { dataValues: loan });
});

/**
 * Updates an existing loan, redirecting to /loans after.
*/
exports.update = asyncHandler(async function(req, res) {
  const { id } = req.params, { body } = req;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  await loanService.update(loan, body);
  res.redirect('/loans/all?page=1&limit=10');
}, { 
  errorView: 'loan/update', 
  model: loanService.model, 
  addToBuild: createUpdateValErrBuild
});

/**
 * Returns an existing loan, redirecting to /loans after.
*/
exports.return = asyncHandler(async function(req, res) {
  const { id } = req.params, { body } = req;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  assertLoanReturn(loan);
  await loanService.update(loan, body);
  res.redirect('/loans/all?page=1&limit=10');
}, { 
  errorView: 'loan/return', 
  model: loanService.model, 
  addToBuild: returnValErrBuild
});
