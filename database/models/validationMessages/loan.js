'use strict';

/**
 * Loan validation messages
*/
exports.messages = {
  loaned_on: {
    notEmpty: '"Loaned On" is required',
    notNull: '"Loaned On" field is required',
    isDate: 'Valid "Loaned On" date is required',
    requiredDate: '"Loaned On" exceeds current date'
  },

  return_by: {
    notEmpty: '"Return By" is required',
    notNull: '"Return By" field is required',
    isDate: 'Valid "Return By" date is required',
    requiredDate: '"Return By" subceeds "Loaned On" date'
  },

  returned_on: {
    isDate: 'Valid "Returned On" date is required',
    requiredDate: '"Returned On" subceeds "Loaned On" date'
  },

  book: {
    notEmpty: '"Book" is required',
    notNull: '"Book" field is required'
  },

  patron: {
    notEmpty: '"Patron" is required',
    notNull: '"Patron" field is required'
  }
};
