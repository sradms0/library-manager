'use strict';

/**
 * @module services/patron
*/

const { Patron } = require('$database/models');
const { Op } = require('sequelize');


/**
 * Read all patrons.
 * @param { object } [config] - configuration for patron reading.
 * @param { number } config.limit - the amount of patrons to read.
 * @param { number } config.offset - where the patron-reading should begin.
 * @returns { Promise }
 *
*/
exports.readAll = function({ limit, offset }={}) {}
