'use strict';

const { asyncHandler } = require('../lib/asyncHandler');
const { sequelize } = require('../../database/models');
const loanData = require('./loanData');

/**
 * Creates loans with assigned patrons and books from ./loanData.json
 * and saves new loans to the database.
*/
exports.load = function() {
  loanData.forEach(i => { 
    asyncHandler(async () => {
      const book = await sequelize.models.Book.findByPk(i.book_id);
      const patron = await sequelize.models.Patron.findByPk(i.patron_id);

      if (book && patron) {
        await sequelize.models.Loan.create(i);
        console.log(`added loan: ${i.loaned_on} - ${i.return_by}`);
      } 
    })();
  });
  console.log('loans loaded');
};
