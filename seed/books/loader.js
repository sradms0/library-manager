'use strict';

/**
 * @module books/loader
*/

const { asyncUtil: {asyncForEach} } = require('$root/lib');
const { asyncHandler } = require('$seed/lib/asyncHandler');
const { sequelize } = require('$database/models');

/**
 * Creates books with genres from JSON data and saves new books to the database.
 * @param bookData - JSON book data
 * @param genreData - JSON book-genre data
 * 
*/
exports.load = async function(bookData, genreData, logging=true) {
  sequelize.options.logging = logging;

  await asyncForEach(bookData, async (book, id) => {
    const idx = Math.floor(Math.random() * genreData.length);
    book.id = id+1; // ensure that book ids are incremented by 1 (needed for production db)
    book.genre = genreData[idx].genre;

    await asyncHandler(async () => {
      if (logging) console.log(`creating book: ${book.title}`);
      await sequelize.models.Book.create(book);
      if (logging) console.log(` -- saved`);
    })();
  });
};
