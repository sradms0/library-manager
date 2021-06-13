'use strict';

const Sequelize = require('sequelize');
const { patron: { 
  messages: { 
    first_name, 
    last_name, 
    address, 
    email, 
    library_id, 
    zip_code 
}}} = require('./validationMessages');


module.exports = sequelize => {
  class Patron extends Sequelize.Model {};
  Patron.init({
    first_name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: first_name.notEmpty},
        notNull: {msg: first_name.notNull},
        is: {
          args: /^[a-z]+$/i, 
          msg: first_name.is
        }
      }
    },
    last_name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: last_name.notEmpty},
        notNull: {msg: last_name.notNull},
        is: {
          args: /^[a-z]+$/i, 
          msg: last_name.is
        }
      }
    },
    name: {
      type: Sequelize.VIRTUAL,
      get() { return `${this.first_name} ${this.last_name}`; }
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: address.notEmpty},
        notNull: {msg: address.notNull}
      }
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: email.notEmpty},
        notNull: {msg: email.notNull},
        isEmail: {msg: email.isEmail}
      },
      unique: {msg: email.unique}
    },

    library_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {msg: library_id.notEmpty},
        notNull: {msg:  library_id.notNull}
      },
      unique: {msg: library_id.unique}
    },

    zip_code: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {msg: zip_code.notEmpty},
        notNull: {msg:  zip_code.notNull},
        isInt: {msg: zip_code.isInt}
      }
    }
  }, { sequelize });

  Patron.associate = models => {
    Patron.hasMany(models.Loan, { 
      foreignKey: { name: 'patron_id', allowNull: false }
    });
  };

  return Patron;
};
