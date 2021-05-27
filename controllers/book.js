'use strict';

/**
 * @module controllers/book
*/

const { book: bookService } = require('$services');
const { 
  errorHandling: {assertFind, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');

/**
 * Creates a new book
*/
exports.create = asyncHandler(async function(req, res) {
  const { body } = req;
  await bookService.create(body);
  res.redirect('/books');
}, { errorView: 'book/new', model: bookService.model });

/**
 * Deletes a book
*/
exports.delete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  await bookService.delete(book);
  res.redirect('/books');
});

/**
 * Reads all books and renders all books to '/views/book/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('books', res, req);
  const renderConf = await readDataAndCreateRenderConf('books', bookService.readAll, req, '/books?');
  res.render('book/index', renderConf);
});

/**
 * Reads books by attribute values based on querystring and renders matches to '/views/book/index'.
 *
*/
exports.readByAttrs = asyncHandler(async function(req, res) {
  assertParams('books/search', res, req);
  const renderConf = await readDataAndCreateRenderConf('books', bookService.readByAttrs, req);
  res.render('book/index', renderConf);
});

/**
 * Reads one book by primary key and renders book to '/views/book/update-book' for deletion confirmation.
 * Sets `res.status` to 404 when a book is not found.
 *
*/
exports.readDelete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  res.render('book/delete', { dataValues: book });
});

/**
 * Reads a new book, rendering '/views/book/new'
*/
exports.readNew = function(req, res) {
  const attrs = Object.keys(bookService.model.tableAttributes);
  const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {});
  res.render('book/new', { dataValues });
};

/**
 * Reads one book by primary key and renders book to '/views/book/update-book'.
 * Sets `res.status` to 404 when a book is not found.
 *
*/
exports.readByPk = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  res.render('book/update', { dataValues: book });
});

/**
 * Updates an existing book, redirecting to /books after.
*/
exports.update = asyncHandler(async function(req, res) {
  const { id } = req.params, { body } = req;
  const book = await bookService.readByPk(id);
  assertFind(book, 'Book', id);
  await bookService.update(book, body);
  res.redirect('/books');
}, { errorView: 'book/update', model: bookService.model });
