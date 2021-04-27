'use strict';

/**
 * @module services/book
*/

const { Book } = require('$database/models')

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
exports.readByPk = function(pk) {
  return Book.findByPk(pk);
}

/**
 * Read all books.
 * @returns { Promise }
 *
*/
exports.readAll = function(order={}) {
  return Book.findAll(order);
}

/**
 * Updates one book
 * @param { Book } book - the book instance to update.
 * @param { Object } data - the data to update the book instance with.
 * @returns { Promise }
*/
exports.update = function(book, data) {
  return new Promise((res, rej) => res(null));
}
