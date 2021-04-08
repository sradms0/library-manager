'use strict';

const { sequelize } = require('../database/models');
const { asyncHandler } = require('./lib/asyncHandler');
const books = require('./books');
const patrons = require('./patrons');
const loans = require('./loans');

asyncHandler(async () => {
  await sequelize.sync();
  books.load();
  patrons.load();
  loans.load();
})();
