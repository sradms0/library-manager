'use strict';

/**
 * @module test/lib/testOperations
*/

const { expect } = require('chai');

const { loader } = require('../../seed/books');
const { sequelize } = require('../../database/models');
const { models: {Book} } = sequelize;

const bookData = require('../data/books.json');
const genreData = require('../data/genres.json');

/**
 * Overwrites previous test-database and re-seeds data for testing.
*/
exports.loadTestDb = function () {
  describe('(Re)Create test database', () => {
    before('testing books', async () => {
      sequelize.options.logging = false;
      await sequelize.sync({ force:true });
      loader.load(bookData, genreData, false);
    });

    it('test-books loaded', async () => {
      const books = await Book.findAll();
      expect(books.length).to.eql(bookData.length);
    });
  });
}
