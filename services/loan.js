'use strict';

/**
 * @module services/loan
*/

const { Book, Loan, Patron, sequelize } = require('$database/models');
const { Op: {and, like, lt, or} } = require('sequelize');

/**
 * Create one loan
 * @param { data } - loan data
 * @returns { Promise }
 *
*/
exports.create = function(data) {
  return Loan.create(data, { include: [Book, Patron] });
}

/**
 * Delete one loan
 * @param { object } - the loan instance to delete
 * @returns { Promise }
 *
*/
exports.delete = function(loan) {
  return loan.destroy();
}

/**
 * Read one loan by primary key
 * @param pk - the primary key of the loan to read
 * @returns { Promise }
 *
*/
exports.readByPk = function(pk) {
  return Loan.findOne({ where: {id: pk}, include: [Book, Patron] });
}

/**
 * Read all loans.
 * @param { object } [config] - configuration for loan reading.
 * @param { number } config.limit - the amount of loans to read.
 * @param { number } config.offset - where the loan-reading should begin.
 * @returns { Promise }
*/
exports.readAll = function({ limit, offset }={}) {
  return Loan.findAndCountAll({ include: [Book, Patron], limit, offset });
};

/**
 * Read loans based on attributes and association attributes
 * @param { string } query - the search term to find loans by
 * @returns { Promise }
 *
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
 * Read checked-out loans.
 * @param { object } [config] - configuration for loan reading.
 * @param { number } config.limit - the amount of checked-out loans to read.
 * @param { number } config.offset - where the checked-out loan-reading should begin.
 * @returns { Promise }
 *
*/
exports.readCheckedOut = function({ limit, offset }={}) {
  const where = { returned_on: null }, 
        include = [ Book, Patron ];
  return Loan.findAndCountAll({ where, include, limit, offset, subQuery: false });
}

/**
 * Read overdue loans.
 * @param { object } [config] - configuration for loan reading.
 * @param { number } config.limit - the amount of overdue loans to read.
 * @param { number } config.offset - where the overdue loan-reading should begin.
 * @returns { Promise }
 *
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
 * Updates one loan
 * @param { object } loan - the loan instance to update.
 * @param { object } data - the data to update the loan instance with.
 * @returns { Promise }
*/
exports.update = function(loan, data) {
  return loan.update(data).then(() => exports.readByPk(loan.id));
};

/** Quick access to model */
exports.model = Loan;
