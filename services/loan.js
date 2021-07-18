'use strict';

/**
 * @module services/loan
*/

const { Book, Loan, Patron } = require('$database/models');
const { Op: {and, lt} } = require('sequelize');

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
