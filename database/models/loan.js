'use strict';

const Sequelize = require('sequelize');
const { loan: {
  messages: {
    loaned_on,
    return_by,
    returned_on,
    book,
    patron
  }
}} = require('./validationMessages');

/**
 * Checks if date is of today, or before.
 * @param {string} field - the fieldname the date belongs to.
 * @param {object} date - the date to assert.
 * @throws Error - if the given date exceeds todays date.
*/
function assertTodayOrBefore(errMsg, date) {
  if (date > new Date())
    throw new Error(errMsg);
}

/**
 * Checks if one date is the same as, or after, another date.
 * @param {string} startField - the fieldname of the start date.
 * @param {string} endField - the fieldname of the end date.
 * @param {object} startDate - the date to compare the end date to.
 * @param {object} endDate - the date that is compared to the start date.
 * @throws Error - if the end date is before the start date
*/
function assertSameOrAfter(errMsg, startDate, endDate) {
  if (endDate < startDate)
    throw new Error(errMsg);
}


module.exports = sequelize => {
  class Loan extends Sequelize.Model {};
  Loan.init({
    loaned_on: {
      type: Sequelize.DATE,
      allowNull: false,
      validate: {
        notEmpty: {msg: loaned_on.notEmpty},
        notNull: {msg: loaned_on.notNull},
        isDate: {msg: loaned_on.isDate},
        requiredDate: value => assertTodayOrBefore(loaned_on.requiredDate, value)
      }
    },
    return_by: {
      type: Sequelize.DATE,
      allowNull: false,
      validate: {
        notEmpty: {msg: return_by.notEmpty},
        notNull: {msg: return_by.notNull},
        isDate: {msg: return_by.isDate},
        requiredDate: function(value) {
          assertSameOrAfter(return_by.requiredDate, this.loaned_on, value)
        }
      }
    },
    returned_on: {
      type: Sequelize.DATE,
      validate: {
        isDate: {msg: returned_on.isDate},
        requiredDate: function(value) {
          assertSameOrAfter(returned_on.requiredDate, this.loaned_on, value)
        }
      }
    }
  }, { sequelize });
  
  Loan.associate = models => {
    Loan.belongsTo(models.Book, { 
      foreignKey: {
        name: 'book_id',
        allowNull: false,
        validate: {
          notEmpty: {msg: book.notEmpty},
          notNull: {msg: book.notNull}
        }
      }
    });
    Loan.belongsTo(models.Patron, {
      foreignKey: {
        name: 'patron_id',
        allowNull: false,
        validate: {
          notEmpty: {msg: patron.notEmpty},
          notNull: {msg: patron.notNull}
        }
      }
    });
  };

  return Loan;
};
