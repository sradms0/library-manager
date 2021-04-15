'use strict';

/**
 * @module services/book
*/

const { Book } = require('../database/models');

/**
 * Create one book
 * @param { data } - book data
 * @returns { Promise }
 *
*/
exports.create = function(data) {
  return Book.create(data);
}

/**
 * Read one book by primary key
 * @param pk - the primary key of the book to read
 * @returns { Promise }
 *
*/
exports.readByPk = function(pk) {}

/**
 * Read all books.
 * @returns { Promise }
 *
*/
exports.readAll = function() {
  return Book.findAll();
}
