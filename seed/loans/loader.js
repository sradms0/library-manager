'use strict';

/**
 * @module loans/loader
*/

const { asyncUtil: {asyncForEach} } = require('$root/lib');
const { asyncHandler } = require('$seed/lib/asyncHandler');

const { sequelize: { 
  models: { Book, Loan, Patron }, 
  options
}} = require('$database/models');

/**
 * Creates loans from JSON data and saves new loans to the database.
 * NOTE: Book and Patrons tables must be created and filled due to relationships.
 * @param {object} loanData - JSON loan data
 * @throws {ReferenceError} when either a Book, or Patron, instance are null/undefined.
 * 
*/
exports.load = async function(loanData, logging=true) {
  options.logging =logging;
  await asyncForEach(loanData, async loan => {
    await asyncHandler(async () => {
      const { book_id, patron_id } = loan,
            book = await Book.findByPk(book_id),
            patron = await Patron.findByPk(patron_id);

      if (book && patron) {
        if (logging) 
          console.log(`creating loan:\n -> book: ${book.title}\n -> patron: ${patron.email}`)
        await Loan.create(loan);
        if (logging) console.log(` -- saved`);
      } else
        throw new Error(`Both book with id ${book_id} and patron with id ${patron_id} must exist`);
    })();
  });
};
