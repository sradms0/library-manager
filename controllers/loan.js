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
  errorHandling: {assertFind, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');


/**
 * Helper to add data to either new or loans for updating after validation errors occur.
 * @param {object} [associationIds] - associative ids of a loan.
 * @param {number} associationIds.book_id - associative id of loans book.
 * @param {number} associationIds.patron_id - associative id of loans patron.
 * @returns {object} the loans associated book and patron, and access to all books and patrons.
*/
async function addToBuild({ book_id, patron_id }) { 
  return {
    Book: book_id ? await bookService.readByPk(book_id) : null,
    Patron: patron_id ? await patronService.readByPk(patron_id) : null,
    books: (await bookService.readAll()).rows, 
    patrons:  (await patronService.readAll()).rows
  }
}


/**
 * Creates a new loan
*/
exports.create = asyncHandler(async function(req, res) {
  const { body } = req;
  await loanService.create(body);
  res.redirect('/loans');
}, { 
  errorView: 'loan/new', 
  model: bookService.model, 
  addToBuild 
});

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
 * Reads a new loan, rendering '/views/loan/new'
*/
exports.readNew = function(req, res) {}

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
  res.redirect('/loans');
}, { 
  errorView: 'loan/update', 
  model: loanService.model, 
  addToBuild
});
