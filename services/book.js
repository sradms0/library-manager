'use strict';

/**
 * Book service for running CRUD related operations for Book instances.
 * @module services/book
*/

const { Book, Patron, Loan } = require('$database/models');
const { Op } = require('sequelize');


/**
 * Creates one book.
 *
 * @example
 * <caption>Passing all properties.</caption>
 * const book = await bookService.create({
 *   title:  'The Epic of Gilgamesh',
 *   author: 'Unknown',
 *   genre:  'Classics',
 *   year:   -1700
 * });
 *
 * @example
 * <caption>Passing only required properties.</caption>
 * const book = await create({ 
 *   title:  'The Epic of Gilgamesh',
 *   author: 'Unknown'
 * });
 *
 * @param   {BookLiteral} data - The {@link BookLiteral} data to be saved.
 * @returns {Promise<(Book|Error)>}
*/
exports.create = function(data) {
  return Book.create(data);
}

/**
 * Deletes one book.
 *
 * @example
 * const book = await bookService.delete(bookInstance);
 *
 * @param   {Book} book - The Book instance to delete.
 * @returns {Promise<Book>}
*/
exports.delete = function(book) {
  return book.destroy();
}

/**
 * Reads books based on attributes.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readByAttrs({ 
 *   query: 'The Book of Job' 
 *   limit: 1,
 *   offset: 10
 * });
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readByAttrs({ query: 'Unknown' });
 *
 * @param   {Object}          [options={}]   - Options for reading searched books with pagination.
 * @param   {String}          options.query  - Attribute value of a book to search for.
 * @param   {Number|String}   options.limit  - How many searched books to read.
 * @param   {Number|String}   options.offset - Where in the database of searched books to start reading.
 * @returns {Promise<{count: Number, rows: Book[]}>}
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
 * Reads one book by primary key.
 *
 * @example
 * const book = await bookService.readByPk(1);
 *
 * @param {Number} pk - The primary key of the book to read.
 * @returns {Promise<Book>}
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
 * Reads all books.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readAll({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readAll();
 *
 * @param   {Object}        [options={}]   - Options for reading all books with pagination.
 * @param   {Number|String} options.limit  - How many books to read.
 * @param   {Number|String} options.offset - Where in the database of all books to start reading.
 * @returns {Promise<{count: Number, rows: Book[]}>}
*/
exports.readAll = function({ limit, offset }={}) {
  return Book.findAndCountAll({ limit, offset });
}

/**
 * Reads checked-out books.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readCheckedOut({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readCheckedOut();
 *
 * @param   {Object}        [options={}]   - Options for reading checked-out books with pagination.
 * @param   {Number|String} options.limit  - How many checked-out-books to read.
 * @param   {Number|String} options.offset - Where in the database of checked-out books to start reading.
 * @returns {Promise<{count: Number, rows: Book[]}>}
*/
exports.readCheckedOut = function({ limit, offset }={}) {
  const where = { 
    [Op.and]: [
      { [Op.not]: {'$Loans.book_id$': null} },
      { '$Loans.returned_on$': null }        
    ]
  }, include = { model: Loan };
   
  return Book.findAndCountAll({ where, include, limit, offset, subQuery: false });
}

/**
 * Read overdue books.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readOverdue({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readOverdue();
 *
 * @param   {Object}          [options={}]   - Options for reading overdue books with pagination.
 * @param   {Number|String}   options.limit  - How many overdue books to read.
 * @param   {Number|String}   options.offset - Where in the database of overdue books to start reading.
 * @returns {Promise<{count: Number, rows: Book[]}>}
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
 * Updates one book.
 *
 * @example
 * <caption>Passing all properties.</caption>
 * const book = await update(bookInstance, {
 *   title:  'Essays', 
 *   author: 'Michel de Montaigne'
 *   genre:  'Middle-grade',
 *   year:   1595
 * });
 *
 * @example
 * <caption>Passing some properties.</caption>
 * const book = await update(bookInstance, { 
 *   title:  'Essays', 
 *   author: 'Michel de Montaigne'
 * });
 *
 * @param {Book}        book - The book instance to update.
 * @param {BookLiteral} data - The {@link BookLiteral}-data to be saved.
 * @returns {Promise<(Book|Error)>}
*/
exports.update = function(book, data) {
  return book.update(data);
}

/** @type {Book} */
exports.model = Book;
