'use strict';

/**
 * Patron service for running CRUD related operations for Patron instances.
 * @module services/patron
*/

const { Book, Loan, Patron, sequelize } = require('$database/models');
const { Op: {and, lt, like, not, or} } = require('sequelize');

/**
 * An object-literal representing a Patron instance
 * @typedef {{first_name: String, last_name: String, address: String, email: String, library_id: String, zip_code: Number}} PatronLiteral
*/

/**
 * Creates one patron.
 *
 * @example
 * const patron = await create({
 *   first_name:  'Pru',
 *   last_name:   'Crisell',
 *   address:     '25271 Beilfuss Avenue',
 *   email:       'pcrisell2@telegraph.co.uk',
 *   library_id:  'MCL1006',
 *   zip_code:    13262
 * });
 *
 * @param {PatronLiteral} data - The {@link PatronLiteral} data to be saved.
 * @returns {Promise<(Patron|Error)>}
*/
exports.create = function(data) {
  return Patron.create(data);
}

/**
 * Deletes one patron.
 *
 * @example
 * const patron = await delete(patronInstance);
 *
 * @param {Patron} patron - The Patron instance to delete.
 * @returns {Promise<Patron>}
*/
exports.delete = function(patron) {
  return patron.destroy();
}


/**
 * Reads all patrons.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readAll({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readAll();
 *
 * @param   {Object}        [options={}]   - Options for reading all patrons with pagination.
 * @param   {Number|String} options.limit  - How many patrons to read.
 * @param   {Number|String} options.offset - Where in the database of all patrons to start reading.
 * @returns {Promise<{count: Number, rows: Patron[]}>}
*/
exports.readAll = function({ limit, offset }={}) {
  return Patron.findAndCountAll({ limit, offset });
}

/**
 * Reads patrons based on attributes.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readByAttrs({ 
 *   query: 'devland ambrogio' 
 *   limit: 1,
 *   offset: 10
 * });
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readByAttrs({ query: 'devland ambrogio' })
 *
 * @param   {Object}          [options={}]   - Options for reading searched patrons with pagination.
 * @param   {String}          options.query  - Attribute value of a patron to search for.
 * @param   {Number|String}   options.limit  - How many searched patrons to read.
 * @param   {Number|String}   options.offset - Where in the database of searched patrons to start reading.
 * @returns {Promise<{count: Number, rows: Patron[]}>}
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
 * Reads one patron by primary key.
 *
 * @example
 * const patron = await readByPk(1);
 *
 * @param {Number} pk - The primary key of the patron to read.
 * @returns {Promise<Patron>}
*/
exports.readByPk = function(pk) {
  return Patron.findOne({
    where: {id: pk},
    include: { model: Loan, include: [Book, Patron] }
  });
}

/**
 * Reads patrons with unreturned loans.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readCheckedOut({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readCheckedOut();
 *
 * @param   {Object}        [options={}]   - Options for reading patrons with unreturned loans with pagination.
 * @param   {Number|String} options.limit  - How many patrons with unreturned loans to read.
 * @param   {Number|String} options.offset - Where in the database of patrons with unreturned loans to start reading.
 * @returns {Promise<{count: Number, rows: Patron[]}>}
*/
exports.readCheckedOut = function({ limit, offset }={}) {
  const where = {
    [and]: [
      { [not]: {'$Loans.book_id$': null} },
      { '$Loans.returned_on$': null }        
    ]
  }, include = { model: Loan };

  return Patron.findAndCountAll({ where, include, limit, offset, subQuery: false });
}

/**
 * Read patrons with overdue loans.
 *
 * @example
 * <caption>With pagination args.</caption>
 * const { count, rows } = await readOverdue({ limit:1, offset: 10 });
 *
 * @example
 * <caption>Without pagination args.</caption>
 * const { count, rows } = await readOverdue();
 *
 * @param   {Object}          [options={}]   - Options for reading patrons with overdue loans with pagination.
 * @param   {Number|String}   options.limit  - How many patrons with overdue loans to read.
 * @param   {Number|String}   options.offset - Where in the database of patrons with overdue loans to start reading.
 * @returns {Promise<{count: Number, rows: Patron[]}>}
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
 * Updates one patron.
 *
 * @example
 * <caption>Passing all properties.</caption>
 * const patron = await update(patronInstance, {
 *   first_name:  'Elnora',
 *   last_name:   'Vere',
 *   address:     '676 Nancy Drive',
 *   email:       'evere1e@psu.edu',
 *   library_id:  'MCL1054',
 *   zip_code:    15627
 * });
 *
 * @example
 * <caption>Passing some properties.</caption>
 * const patron = await update(patronInstance, { 
 *   first_name:  'Elnora',
 *   last_name:   'Vere',
 * });
 *
 * @param {Patron} patron - The patron instance to update.
 * @param {PatronLiteral} data - The {@link PatronLiteral}-data to be saved.
 * @returns {Promise<(Patron|Error)>}
*/
exports.update = function(patron, data) {
  return patron.update(data);
}

/** @type {Patron} */
exports.model = Patron;
