'use strict';

/**
 * Book controller that uses a Book service to run CRUD operations 
 * and render data via book related pug-templates.
 * @module controllers/book
*/

const { book: bookService } = require('$services');
const { 
  errorHandling: {assertFind, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');

/**
 * Creates a new book and redirects to `/books/all` with pagination.
 * `RenderOptions` are enabled for errored-data, re-rendering `/views/book/new`.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/books/new', create);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.create = asyncHandler(async function(req, res) {
  const { body } = req;
  await bookService.create(body);
  res.redirect('/books/all?page=1&limit=10');
}, { errorView: 'book/new', model: bookService.model });

/**
 * Deletes a book and redirects to `/books/all` with pagination.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/books/:id/delete', delete);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.delete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  await bookService.delete(book);
  res.redirect('/books/all?page=1&limit=10');
});

/**
 * Reads all books and renders all books to '/views/book/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/books/all', readAll);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('books/all', res, req);
  const renderConf = await readDataAndCreateRenderConf('books', bookService.readAll, req, '/books/all?');
  res.render('book/index', renderConf);
});

/**
 * Reads books by attribute values based on a query-string and renders matches to '/views/book/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/books/search', readByAttrs);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readByAttrs = asyncHandler(async function(req, res) {
  const { query: {q} } = req;
  assertParams('books/search', res, req);
  const renderConf = await readDataAndCreateRenderConf('books', bookService.readByAttrs, req, `/books/search?q=${q}&`);
  res.render('book/index', renderConf);
});

/**
 * Reads all checked-out books and renders books to '/views/book/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/books/checked-out', readCheckedOut);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readCheckedOut = asyncHandler(async function(req, res) {
  assertParams('books/checked-out', res, req);
  const renderConf = await readDataAndCreateRenderConf('books', bookService.readCheckedOut, req, '/books/checked-out?');
  res.render('book/index', renderConf);
});

/**
 * Reads all overdue books and renders books to '/views/book/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/books/overdue', readOverdue);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readOverdue = asyncHandler(async function(req, res) {
  assertParams('books/overdue', res, req);
  const renderConf = await readDataAndCreateRenderConf('books', bookService.readOverdue, req, '/books/overdue?');
  res.render('book/index', renderConf);
});

/**
 * Reads one book by primary key and renders the book to '/views/book/delete' for deletion confirmation.
 * `res.status` is set to `404` if the book is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/books/:id/delete', readDelete);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readDelete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  res.render('book/delete', { dataValues: book });
});

/**
 * Creates a `BookLiteral` with empty values to render to '/views/book/new'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/books/new', readNew);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readNew = function(req, res) {
  const attrs = Object.keys(bookService.model.tableAttributes);
  const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {});
  res.render('book/new', { dataValues });
};

/**
 * Reads one book by primary key and renders the book to '/views/book/update'.
 * `res.status` is set to `404` if the book is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/books/:id/update', readByPk);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readByPk = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  res.render('book/update', { dataValues: book });
});

/**
 * Updates an existing book and redirects to `/books/all` with pagination.
 * `res.status` is set to `404` if the book is not found.
 * `RenderOptions` are enabled for errored-data, re-rendering `/views/book/update`.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/books/:id/update', update);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.update = asyncHandler(async function(req, res) {
  const { id } = req.params, { body } = req;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  await bookService.update(book, body);
  res.redirect('/books/all?page=1&limit=10');
}, { 
  errorView: 'book/update', 
  model: bookService.model, 
  addToBuild: async ({ params: {id} }) => 
    ({Loans: (await bookService.readByPk(id)).Loans})
});
