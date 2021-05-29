'use strict';

/**
 * @module books/loader
*/

const { asyncUtil: {asyncForEach} } = require('$root/lib');
const { asyncHandler } = require('$seed/lib/asyncHandler');
const { sequelize } = require('$database/models');

/**
 * Creates patrons with library-ids from and ./patrons.json, saving them to a database.
 * @param {object} patronData - library patron data (without ids)
 * @param {object} libraryIdData - library ids to assign to patrons
 * 
*/
exports.load = async function(patronData, libraryIdData, logging=true) {
  sequelize.options.logging = logging;
  await asyncForEach(patronData, async (patron, idx) => {
    patron.library_id = libraryIdData[idx].library_id;

    await asyncHandler(async () => {
      if (logging) console.log(`creating patron: ${patron.first_name} ${patron.last_name}`);
      await sequelize.models.Patron.create(patron);
      if (logging) console.log(` -- saved`);
    })();
  });
}
