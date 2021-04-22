'use strict';

/**
 * @module test/lib/testOperations
*/

const { expect } = require('chai');

const { loader } = require('$seed/books');
const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

const bookData = require('$test/data/books.json');
const genreData = require('$test/data/genres.json');

/**
 * Overwrites previous test-database and re-seeds data for testing.
*/
exports.loadTestDb = async function () {
  sequelize.options.logging = false;
  await sequelize.sync({ force:true });
  await loader.load(bookData, genreData, false);
}
