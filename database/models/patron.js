'use strict';

const Sequelize = require('sequelize');

module.exports = sequelize => {
  class Patron extends Sequelize.Model {};
  Patron.init({
    first_name: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {msg: 'First Name Required'},
        is: {
          args: /^[a-z]+$/i, 
          msg: 'Valid First Name Required: Letters Only'
        }
      }
    },
    last_name: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {msg: 'Last Name Required'},
        is: {
          args: /^[a-z]+$/i, 
          msg: 'Valid Last Name Required: Letters Only'
        }
      }
    },
    address: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {msg: 'Address Required'},
      }
    },
    email: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {msg: 'Email Required'},
        isEmail: {msg: 'Valid Email Required'}
      }
    },
    library_id: {
      type: Sequelize.STRING,
      unique: true,
      validate: {
        notEmpty: {msg: 'Library ID Required'},
      }
    },
    zip_code: {
      type: Sequelize.INTEGER,
      validate: {
        notEmpty: {msg: 'Zip Code Required'},
        isInt: {msg: 'Valid Zip Code Required'}
      }
    }
  }, { sequelize });

  Patron.associate = models => {
    Patron.hasMany(models.Loan, { foreignKey: 'patron_id' });
  };

  return Patron;
};
