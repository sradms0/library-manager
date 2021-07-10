'use strict';

/**
 * @module services/patron
*/

const { Book, Loan, Patron, sequelize } = require('$database/models');
const { Op } = require('sequelize');


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
    [Op.or]: [ 
      sequelize.literal(`first_name || " " || last_name LIKE "${query}"`),
      {first_name: { [Op.like]: `%${query}%` }},
      {last_name:  { [Op.like]: `%${query}%` }},
      {email:      { [Op.like]: `%${query}%` }},
      {address:    { [Op.like]: `%${query}%` }},
      {zip_code:   { [Op.like]: `%${query}%` }},
      {library_id: { [Op.like]: `%${query}%` }},
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
