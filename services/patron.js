'use strict';

/**
 * @module services/patron
*/

const { Patron } = require('$database/models');
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
 * Read one patron by primary key
 * @param pk - the primary key of the patron to read
 * @returns { Promise }
 *
*/
exports.readByPk = function(pk) {
  return Patron.findByPk(pk);
}

/**
 * Updates one patron
 * @param { Patron } patron - the patron instance to update.
 * @param { Object } data - the data to update the patron instance with.
 * @returns { Promise }
*/
exports.update = function(patron, data) {}

/** Quick access to model */
exports.model = Patron;
