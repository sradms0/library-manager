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
 * Checks for a Date instance.
 * @private
 * @param   {Date} date - an expected date object.
 * @return  {Boolean}   - based on `date` being a Date instance.
*/
function isDate(date) {
  return date instanceof Date;
}

/**
 * Checks if date is of today, or before.
 * @private
 * @param {String}  field - The fieldname the date belongs to.
 * @param {Date}    date  - The date to assert.
 * @throws          Error - if the given date exceeds todays date.
*/
function assertTodayOrBefore(errMsg, date) {
  if (isDate(date) && date > new Date())
    throw new Error(errMsg);
}

/**
 * Checks if one date is the same as, or after, another date.
 * @private
 * @param   {String} startField - The fieldname of the start date.
 * @param   {String} endField   - The fieldname of the end date.
 * @param   {Object} startDate  - The date to compare the end date to.
 * @param   {Object} endDate    - The date that is compared to the start date.
 * @throws  {Error}             - If the end date is before the start date
*/
function assertSameOrAfter(errMsg, startDate, endDate) {
  if (isDate(startDate) && isDate(endDate) && endDate < startDate)
    throw new Error(errMsg);
}

/**
 * A model that represents a loan. A Loan belongs to one Book and one Patron.
 * @class Loan
 * @memberof module:models
 * @extends external:sequelize.Model
*/
module.exports = sequelize => {
  class Loan extends Sequelize.Model {};
  Loan.init({
    /**
     * @memberof module:models.Loan
     * @instance
     * @type {Date}
    */
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
    /**
     * @memberof module:models.Loan
     * @instance
     * @type {Date}
    */
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
    /**
     * @memberof module:models.Loan
     * @instance
     * @type {Date}
    */
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
      },
      onDelete: 'CASCADE'
    });
  };

  return Loan;
};
