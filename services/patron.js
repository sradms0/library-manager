'use strict';

/**
 * @module services/patron
*/

const { Book, Loan, Patron, sequelize } = require('$database/models');
const { Op: {and, lt, like, or} } = require('sequelize');


/**
 * Create one patron
 * @param {object} - patron data
 * @returns {Promise}
 *
*/
exports.create = function(data) {
  return Patron.create(data);
}

/**
 * Delete one book
 * @param { object } patron - the Patron instance to delete
 * @returns { Promise }
*/
exports.delete = function(patron) {
  return patron.destroy();
}


/**
 * Read all patrons.
 * @param { object } [config] - configuration for patron reading.
 * @param { number } config.limit - the amount of patrons to read.
 * @param { number } config.offset - where the patron-reading should begin.
 * @returns { Promise }
 *
*/
exports.readAll = function({ limit, offset }={}) {
  return Patron.findAndCountAll({ limit, offset });
}

/**
 * Read books based on attributes
 * @param { string } query - the search term to find books by
 * @returns { Promise }
 *
*/
exports.readByAttrs = function({ query, limit, offset }={}) {
  const where = {
    [or]: [ 
      sequelize.literal(`first_name || " " || last_name LIKE "${query}"`),
      {first_name: { [like]: `%${query}%` }},
      {last_name:  { [like]: `%${query}%` }},
      {email:      { [like]: `%${query}%` }},
      {address:    { [like]: `%${query}%` }},
      {zip_code:   { [like]: `%${query}%` }},
      {library_id: { [like]: `%${query}%` }},
    ]
  };
  return Patron.findAndCountAll({ where, limit, offset });
}

/**
 * Read one patron by primary key
 * @param pk - the primary key of the patron to read
 * @returns { Promise }
 *
*/
exports.readByPk = function(pk) {
  return Patron.findOne({
    where: {id: pk},
    include: { model: Loan, include: [Book, Patron] }
  });
}

/**
 * Read patrons with checked-out loans
 * @param { object } [config] - configuration for patron reading.
 * @param { number } config.limit - the amount of patrons with checked-out loans to read.
 * @param { number } config.offset - where the checked-out patron-reading should begin.
 * @returns { Promise }
 *
*/
exports.readCheckedOut = function({ limit, offset }={}) {}

/**
 * Read patrons with overdue loans
 * @param { object } [config] - configuration for patron reading.
 * @param { number } config.limit - the amount of patrons with overdue loans to read.
 * @param { number } config.offset - where the overdue patron-reading should begin.
 * @returns { Promise }
 *
*/
exports.readOverdue = function({ limit, offset }={}) {
  const where = { 
    [and]: [
      { '$Loans.returned_on$': null },
      { '$Loans.return_by$': { [lt]: new Date() } }
    ]
  }, include = { model: Loan }

  return Patron.findAndCountAll({ where, include, limit, offset, subQuery: false });
}

/**
 * Updates one patron
 * @param { Patron } patron - the patron instance to update.
 * @param { Object } data - the data to update the patron instance with.
 * @returns { Promise }
*/
exports.update = function(patron, data) {
  return patron.update(data);
}

/** Quick access to model */
exports.model = Patron;
