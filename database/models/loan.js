'use strict';

const Sequelize = require('sequelize');
const { sequelize } = require('./');

function isTodayOrBefore(value) {
  if (new Date(value) >=  new Date().setDate(new Date().getDate() + 1))
    throw new Error(`Date Exceeds Today`);
}

module.exports = sequelize => {
  class Loan extends Sequelize.Model {};
  Loan.init({
    loaned_on: {
      type: Sequelize.DATE,
      validate: {
        isDate: {msg: 'Valid Date Required: Loaned On '},
        requiredDate: value => isTodayOrBefore(value)
      }
    },
    return_by: {
      type: Sequelize.DATE,
      validate: {
        isDate: {msg: 'Valid Date Required: Return By '}
      }
    },
    returned_on: {
      type: Sequelize.DATE,
      validate: {
        isDate: {msg: 'Valid Date Required: Returned On '},
        requiredDate: value => isTodayOrBefore(value)
      }
    }
  }, { sequelize });
  
  Loan.associate = models => {
    Loan.belongsTo(models.Book, { foreignKey: 'book_id' });
    Loan.belongsTo(models.Patron, { foreignKey: 'patron_id' });
  };

  return Loan;
};
