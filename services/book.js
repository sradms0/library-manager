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
exports.create = function(data) {}

/**
 * Read all books.
 * @returns { Promise }
 *
*/
exports.readAll = function() {
  return Book.findAll();
}
