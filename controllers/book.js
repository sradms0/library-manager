'use strict';

/**
 * @module controllers/book
*/

const { book: bookService } = require('../services');
const { asyncHandler } = require('../lib/errorHandling');

/**
 * Reads all books and renders all books to '/views/book/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  res.render('book/index', {});
});
