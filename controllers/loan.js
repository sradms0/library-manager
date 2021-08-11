'use strict';

/**
 * Loan controller that uses a Loan service to run CRUD operations 
 * and render data via loan related pug-templates.
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
 * @param   {Request} req                 - The request object from a route.
 * @param   {Object}  req.body            - The requests body contain associated book and patron ids.
 * @param   {Number}  req.body.book_id    - The loans associated book id.
 * @param   {Number}  req.body.patron_id  - The loans associated patron id.
 * @returns {Object}                      - The loans associated book and patron, and access to all books and patrons.
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
 * @param   {Request} req                 - The request object from a route.
 * @param   {Object}  req.body            - The requests body contain associated book and patron ids.
 * @param   {Number}  req.body.book_id    - The loans associated book id.
 * @param   {Number}  req.body.patron_id  - The loans associated patron id.
 * @returns {Object}                      - The loans associated book and patron.
 */
async function returnValErrBuild({ body: {book_id, patron_id} }) {
  return {
    Book: await bookService.readByPk(book_id),
    Patron: await patronService.readByPk(patron_id)
  }
}


/**
 * Creates a new loan and redirects to `/loans/all` with pagination.
 * `RenderOptions` are enabled for errored-data, re-rendering `/views/loan/new`.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/loans/new', create);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
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
 * Deletes a loan and redirects to `/loans/all` with pagination.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/loans/:id/delete', delete);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.delete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  await loanService.delete(loan);
  res.redirect('/loans/all?page=1&limit=10');
});

/**
 * Reads all loans and renders all loans to '/views/loan/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/all', readAll);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('loans/all', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readAll, req, '/loans/all?');
  res.render('loan/index', renderConf);
});


/**
 * Reads loans by attribute values based on a query-string and renders matches to '/views/loan/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/search', readByAttrs);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readByAttrs = asyncHandler(async function(req, res) {
  const { query: {q} } = req;
  assertParams('loans/search', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readByAttrs, req, `/loans/search?q=${q}&`);
  res.render('loan/index', renderConf);
});

/**
 * Reads all unreturned loans and renders loans to '/views/loan/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/checked-out', readCheckedOut);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readCheckedOut = asyncHandler(async function(req, res) {
  assertParams('loans/checked-out', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readCheckedOut, req, '/loans/checked-out?');
  res.render('loan/index', renderConf);
});

/**
 * Reads one loan by primary key and renders the book to '/views/loan/delete' for deletion confirmation.
 * `res.status` is set to `404` if the loan is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/:id/delete', readDelete);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readDelete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  res.render('loan/delete', { dataValues: loan });
});

/**
 * Creates a `LoanLiteral` with empty values to render to '/views/loan/new'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/new', readNew);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
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
 * Reads all overdue loans and renders loans to '/views/loan/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/overdue', readOverdue);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readOverdue = asyncHandler(async function(req, res) {
  assertParams('loans/overdue', res, req);
  const renderConf = await readDataAndCreateRenderConf('loans', loanService.readOverdue, req, '/loans/overdue?');
  res.render('loan/index', renderConf);
});

/**
 * Reads one loan by primary key and renders the loan to '/views/loan/update'.
 * `res.status` is set to `404` if the loan is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/:id/update', readByPk);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
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
 * Reads one loan by primary key and renders the loan to '/views/loan/return' for return confirmation.
 * `res.status` is set to `404` if the loan is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/loans/:id/return', readReturn);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readReturn = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const loan = await loanService.readByPk(id);
  assertFind(loan, 'Loan', id);
  assertLoanReturn(loan)
  res.render('loan/return', { dataValues: loan });
});

/**
 * Updates an existing loan and redirects to `/loans/all` with pagination.
 * `res.status` is set to `404` if the loan is not found.
 * `RenderOptions` are enabled for errored-data, re-rendering `/views/loan/update`.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/loans/:id/update', update);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
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
 * Returns an existing loan and redirects to `/loans/all` with pagination.
 * `res.status` is set to `404` if the loan is not found.
 * `RenderOptions` are enabled for errored-data, re-rendering `/views/loan/update`.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/loans/:id/update', update);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
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
