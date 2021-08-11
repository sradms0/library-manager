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

/**
 * A model that represents a patron. A Patron can have many Loans.
 * @class Patron
 * @memberof module:models
 * @extends external:sequelize.Model
*/
module.exports = sequelize => {
  class Patron extends Sequelize.Model {};
  Patron.init({
    /**
     * @memberof module:models.Patron
     * @instance
     * @type {String}
    */
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
    /**
     * @memberof module:models.Patron
     * @instance
     * @type {String}
    */
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
    /**
     * @memberof module:models.Patron
     * @instance
     * @type {String}
    */
    name: {
      type: Sequelize.VIRTUAL,
      get() { return `${this.first_name} ${this.last_name}`; }
    },
    /**
     * @memberof module:models.Patron
     * @instance
     * @type {String}
    */
    address: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {msg: address.notEmpty},
        notNull: {msg: address.notNull}
      }
    },
    /**
     * @memberof module:models.Patron
     * @instance
     * @type {String}
    */
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
    /**
     * @memberof module:models.Patron
     * @instance
     * @type {String}
    */
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
    /**
     * @memberof module:models.Patron
     * @instance
     * @type {Number}
    */
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
