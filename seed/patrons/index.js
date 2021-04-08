'use strict';

const { asyncHandler } = require('../lib/asyncHandler');
const { sequelize } = require('../../database/models');
const patronData = require('./patrons');
const libraryIdData = require('./libraryId');

/**
 * Creates patrons with library-ids from and ./patrons.json and ./libraryId.json 
 * and saves new books to the database.
 * 
*/
exports.load = function() {
  patronData.forEach((i,idx) => {
    i.library_id = libraryIdData[idx].library_id;

    asyncHandler(async () => {
      await sequelize.models.Patron.create(i);
      console.log(`added patron: ${i.first_name} ${i.last_name}`);
    })();
  });
  console.log('patrons loaded');
}
