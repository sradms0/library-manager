'use strict';

const { sequelize } = require('../database/models');
const { asyncHandler } = require('./lib/asyncHandler');
const bookSeeder = require('./books');

const { data: {books, genres}, loader: bookLoader } = bookSeeder;

asyncHandler(async () => {
  await sequelize.sync({ force: true });
  await bookLoader.load(books, genres);
})();
