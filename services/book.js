'use strict';

/**
 * @module services/book
*/

const { Book } = require('$database/models');
const { Op } = require('sequelize');

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
 * Delete one book
 * @param { object } - the book instance to delete
 * @returns { Promise }
 *
*/
exports.delete = function(book) {
  return book.destroy();
}

/**
 * Read books based on attributes
 * @param { string } query - the search term to find books by
 * @returns { Promise }
 *
*/
exports.readByAttrs = function(query) {
  return Book.findAll({
    where: {
      [Op.or]: {
        title:    { [Op.like]: `%${query}%` },
        author:   { [Op.like]: `%${query}%` },
        genre:    { [Op.like]: `%${query}%` },
        year:     { [Op.like]: `%${query}%` }
      }
    }
  });
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
exports.readAll = function() {
  return Book.findAll();
}

/**
 * Updates one book
 * @param { Book } book - the book instance to update.
 * @param { Object } data - the data to update the book instance with.
 * @returns { Promise }
*/
exports.update = function(book, data) {
  return book.update(data);
}

/** Quick access to model */
exports.model = Book;
