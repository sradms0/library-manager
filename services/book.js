'use strict';

/**
 * @module services/book
*/

const { Book, Patron, Loan } = require('$database/models');
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
exports.readByAttrs = function({ query, limit, offset }={}) {
  const where = {
      [Op.or]: {
        title:    { [Op.like]: `%${query}%` },
        author:   { [Op.like]: `%${query}%` },
        genre:    { [Op.like]: `%${query}%` },
        year:     { [Op.like]: `%${query}%` }
      }
  };
  return Book.findAndCountAll({ where, limit, offset });
}

/**
 * Read one book by primary key
 * @param pk - the primary key of the book to read
 * @returns { Promise }
 *
*/
exports.readByPk = function(pk) {
  return Book.findOne({ 
    where: {id: pk},
    include: {
      model: Loan, 
      include: [Book, Patron]
    }
  });
}

/**
 * Read all books.
 * @param { object } [config] - configuration for book reading.
 * @param { number } config.limit - the amount of books to read.
 * @param { number } config.offset - where the book-reading should begin.
 * @returns { Promise }
 *
*/
exports.readAll = function({ limit, offset }={}) {
  return Book.findAndCountAll({ limit, offset });
}

/**
 * Read overdue books.
 * @param { object } [config] - configuration for book reading.
 * @param { number } config.limit - the amount of overdue books to read.
 * @param { number } config.offset - where the overdue book-reading should begin.
 * @returns { Promise }
 *
*/
exports.readOverdue = function({ limit, offset }={}) {
  const where = { 
    [Op.and]: [
      { '$Loans.returned_on$': null },
      { '$Loans.return_by$': { [Op.lt]: new Date() } }
    ]
  }, include = { model: Loan }

  return Book.findAndCountAll({ where, include, limit, offset, subQuery: false });
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
