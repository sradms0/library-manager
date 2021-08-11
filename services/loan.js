'use strict';

/**
 * @module services/loan
*/

const { Book, Loan, Patron, sequelize } = require('$database/models');
const { Op: {and, like, lt, or} } = require('sequelize');

/**
 * Creates one loan.
 *
 * @example
 * const loan = await create({
 *   loaned_on:   loanedOnDate,
 *   return_by:   returnByDate,
 *   returned_on: null,
 *   book_id:     1,
 *   patron_id:   2
 * });
 *
 * @param {LoanLiteral} data - The {@link LoanLiteral} data to be saved.
 * @returns {Promise<(Loan|Error)>}
*/
exports.create = function(data) {
  return Loan.create(data, { include: [Book, Patron] });
}

/**
 * Deletes one loan.
 *
 * @example
 * const loan = await delete(loanInstance);
 *
 * @param {Loan} loan - The Loan instance to delete.
 * @returns {Promise<Loan>}
*/
exports.delete = function(loan) {
  return loan.destroy();
}

/**
 * Reads one loan by primary key.
 *
 * @example
 * const loan = await readByPk(1);
 *
 * @param {Number} pk - The primary key of the loan to read.
 * @returns {Promise<Loan>}
*/
exports.readByPk = function(pk) {
  return Loan.findOne({ where: {id: pk}, include: [Book, Patron] });
}

/**
 * Reads all loans.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readAll({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readAll();
 *
 * @param   {Object}        [options={}]   - Options for reading all loans with pagination.
 * @param   {Number|String} options.limit  - How many loans to read.
 * @param   {Number|String} options.offset - Where in the database of all loans to start reading.
 * @returns {Promise<{count: Number, rows: Loan[]}>}
*/
exports.readAll = function({ limit, offset }={}) {
  return Loan.findAndCountAll({ include: [Book, Patron], limit, offset });
};

/**
 * Reads loans based on attributes.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readByAttrs({ 
 *   query: 'The Loan of Job' 
 *   limit: 1,
 *   offset: 10
 * });
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readByAttrs({ query: 'Unknown' })
 *
 * @param   {Object}          [options={}]   - Options for reading searched loans with pagination.
 * @param   {String}          options.query  - Attribute value of a loan to search for.
 * @param   {Number|String}   options.limit  - How many searched loans to read.
 * @param   {Number|String}   options.offset - Where in the database of searched loans to start reading.
 * @returns {Promise<{count: Number, rows: Loan[]}>}
*/
exports.readByAttrs = function({ query, limit, offset }={}) {
  const where = {
    [or]: [
      sequelize.where(
        sequelize.fn('date', sequelize.col('loaned_on')), 
        { [like]: `%${query}%` }
      ),
      sequelize.where(
        sequelize.fn('date', sequelize.col('return_by')), 
        { [like]: `%${query}%` }
      ),
      sequelize.where(
        sequelize.fn('date', sequelize.col('returned_on')), 
        { [like]: `%${query}%` }
      ),

      {'$Book.title$': { [like]: `%${query}%` }},

      sequelize.literal(`first_name || " " || last_name LIKE "${query}"`),
      {'$Patron.first_name$': { [like]: `%${query}%`}},
      {'$Patron.last_name$': { [like]: `%${query}%`}}
    ]
  }, include = [ Book, Patron ];

  return Loan.findAndCountAll({ where, include, limit, offset, subQuery: false });
}

/**
 * Reads unreturned loans.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readCheckedOut({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readCheckedOut();
 *
 * @param   {Object}        [options={}]   - Options for reading unreturned loans with pagination.
 * @param   {Number|String} options.limit  - How many unreturned loans to read.
 * @param   {Number|String} options.offset - Where in the database of unreturned loans to start reading.
 * @returns {Promise<{count: Number, rows: Loan[]}>}
*/
exports.readCheckedOut = function({ limit, offset }={}) {
  const where = { returned_on: null }, 
        include = [ Book, Patron ];
  return Loan.findAndCountAll({ where, include, limit, offset, subQuery: false });
}

/**
 * Read overdue loans.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readOverdue({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readOverdue();
 *
 * @param   {Object}          [options={}]   - Options for reading overdue loans with pagination.
 * @param   {Number|String}   options.limit  - How many overdue loans to read.
 * @param   {Number|String}   options.offset - Where in the database of overdue loans to start reading.
 * @returns {Promise<{count: Number, rows: Loan[]}>}
*/
exports.readOverdue = function({ limit, offset }={}) {
  const where = {
    [and]: [
      { returned_on: null },
      { return_by: { [lt]: new Date() } }
    ]
  }, include = [ Book, Patron ];

  return Loan.findAndCountAll({ where, include, limit, offset, subQuery: false });
}

/**
 * Updates one loan.
 *
 * @example
 * <caption>Passing all properties.</caption>
 * const loan = await update(loanInstance, {
 *   loaned_on:   loanedOnDate,
 *   return_by:   returnByDate,
 *   returned_on: null,
 *   book_id:     1,
 *   patron_id:   2
 * });
 *
 * @example
 * <caption>Passing some properties.</caption>
 * const loan = await update(loanInstance, { 
 *   loaned_on:   loanedOnDate,
 *   return_by:   returnByDate,
 * });
 *
 * @param {Loan} loan - The loan instance to update.
 * @param {LoanLiteral} data - The {@link LoanLiteral}-data to be saved.
 * @returns {Promise<(Loan|Error)>}
*/
exports.update = function(loan, data) {
  return loan.update(data).then(() => exports.readByPk(loan.id));
};

/** @type {Loan} */
exports.model = Loan;
