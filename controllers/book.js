'use strict';

/**
 * @module controllers/book
*/

const { book: bookService } = require('$services');
const { asyncHandler } = require('$root/lib/errorHandling');

/**
 * Creates a new book
*/
exports.create = asyncHandler(async function(req, res) {});

/**
 * Reads all books and renders all books to '/views/book/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  const allBooks = await bookService.readAll({ order: [['title', 'ASC']] });
  res.render('book/index', {books: allBooks});
});

/**
 * Reads one book by primary key and renders book to '/views/book/update-book'.
 * Sets `res.status` to 404 when a book is not found.
 *
*/
exports.readByPk = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const book = await bookService.readByPk(id);
  if (!book) throw new Error(`Book with id ${id} does not exist`);
  res.render('book/update', { book });
});
