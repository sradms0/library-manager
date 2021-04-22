'use strict';

/**
 * @module controllers/book
*/

const { book: bookService } = require('$services');
const { asyncHandler } = require('$root/lib/errorHandling');

/**
 * Reads all books and renders all books to '/views/book/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  const allBooks = await bookService.readAll({ order: [['title', 'ASC']] });
  res.render('book/index', {books: allBooks});
});
