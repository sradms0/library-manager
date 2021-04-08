'use strict';

const { asyncHandler } = require('../lib/asyncHandler');
const { sequelize } = require('../../database/models');
const bookData = require('./books');
const genreData = require('./genres');

/**
 * Creates books with genres from ./books.json and ./genres.json
 * and saves new books to the database.
 * 
*/
exports.load = function() {
  bookData.forEach(i => {
    const idx = Math.floor(Math.random() * genreData.length);
    i.genre = genreData[idx].genre;

    asyncHandler(async () => {
      await sequelize.models.Book.create(i);
      console.log(`added book: ${i.title}`);
    })();
  });
  console.log('books loaded');
};
