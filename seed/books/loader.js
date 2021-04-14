'use strict';

/**
 * @module books/loader
*/

const { asyncHandler } = require('../lib/asyncHandler');
const { sequelize } = require('../../database/models');

/**
 * Creates books with genres from JSON data and saves new books to the database.
 * @param bookData - JSON book data
 * @param genreData - JSON book-genre data
 * 
*/
exports.load = function(bookData, genreData, logging=true) {
  bookData.forEach(i => {
    const idx = Math.floor(Math.random() * genreData.length);
    i.genre = genreData[idx].genre;

    asyncHandler(async () => {
      await sequelize.models.Book.create(i);
      if (logging) console.log(`added book: ${i.title}`);
    })();
  });
  if (logging) console.log('books loaded');
};
