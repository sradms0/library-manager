'use strict';

/**
 * @module controllers/book
*/

const { book: bookService } = require('$services');
const { assertFind, asyncHandler } = require('$root/lib/errorHandling');

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
exports.delete = asyncHandler(async function(req, res) {});

/**
 * Reads all books and renders all books to '/views/book/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  const allBooks = await bookService.readAll({ order: [['title', 'ASC']] });
  res.render('book/index', {books: allBooks});
});

/**
 * Reads a new book, rendering '/views/book/new'
*/
exports.readNew = function(req, res) {
  res.render('book/new');
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
