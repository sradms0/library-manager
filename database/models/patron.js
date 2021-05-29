'use strict';

const Sequelize = require('sequelize');

module.exports = sequelize => {
  class Patron extends Sequelize.Model {};
  Patron.init({
    first_name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: '"First Name" is required'},
        notNull: {msg: '"First Name" field is required'},
        is: {
          args: /^[a-z]+$/i, 
          msg: 'Valid First Name is required: letters only'
        }
      }
    },
    last_name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: '"Last Name" is required'},
        notNull: {msg: '"Last Name" field is required'},
        is: {
          args: /^[a-z]+$/i, 
          msg: 'Valid Last Name is required: letters only'
        }
      }
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: '"Address" is required'},
        notNull: {msg: '"Address" field is required'}
      }
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: '"Email" is required'},
        notNull: {msg: '"Email" field is required'},
        isEmail: {msg: 'Valid Email is required'}
      },
      unique: {msg: 'Email already exists'}
    },
    library_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {msg: '"Library ID" is required'},
        notNull: {msg: '"Library ID" field is required'}
      },
      unique: {msg: 'Library ID already exists'}
    },
    zip_code: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {msg: '"Zip Code" is required'},
        notNull: {msg: '"Zip Code" field is required'},
        isInt: {msg: 'Valid Zip Code is required'}
      }
    }
  }, { sequelize });

  Patron.associate = models => {
    Patron.hasMany(models.Loan, { foreignKey: 'patron_id' });
  };

  return Patron;
};
