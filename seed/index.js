'use strict';

const { sequelize } = require('../database/models');
const { asyncHandler } = require('./lib/asyncHandler');
const bookSeeder = require('./books');
const patronSeeder = require('./patrons');

const { data: {books, genres}, loader: bookLoader } = bookSeeder;
const { data: {patrons, libraryIds}, loader: patronLoader } = patronSeeder;

asyncHandler(async () => {
  await sequelize.sync({ force: true });
  await bookLoader.load(books, genres);
  await patronLoader.load(patrons, libraryIds);
})();
