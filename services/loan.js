'use strict';

/**
 * @module services/loan
*/

const { Book, Loan, Patron } = require('$database/models');

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
 * Read one loan by primary key
 * @param pk - the primary key of the loan to read
 * @returns { Promise }
 *
*/
exports.readByPk = function(pk) {}

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

/** Quick access to model */
exports.model = Loan;
