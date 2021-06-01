'use strict';

/**
 * Patron validation messages
*/
exports.messages = {
  first_name: {
    notEmpty: '"First Name" is required',
    notNull: '"First Name" field is required',
    is: 'Valid First Name is required: letters only'
  },

  last_name: {
    notEmpty: '"Last Name" is required',
    notNull: '"Last Name" field is required',
    is: 'Valid Last Name is required: letters only'
  },

  address: {
    notEmpty: '"Address" is required',
    notNull: '"Address" field is required'
  },

  email: {
    notEmpty: '"Email" is required',
    notNull: '"Email" field is required',
    isEmail: 'Valid Email is required',
    unique: 'Email already exists'
  },

  library_id: {
    notEmpty: '"Library ID" is required',
    notNull: '"Library ID" field is required',
    unique: 'Library ID already exists'
  },

  zip_code: {
    notEmpty: '"Zip Code" is required',
    notNull: '"Zip Code" field is required',
    isInt: 'Valid Zip Code is required'
  }
};
