'use strict';

const Sequelize = require('sequelize');
const { sequelize } = require('./');
const { book: { messages: { title, author } }} = require('./validationMessages');


/**
 * A model that represents a book. A Book has many Loans.
 * @class Book
 * @memberof module:models
 * @extends external:sequelize.Model
*/
module.exports = sequelize => {
  class Book extends Sequelize.Model {};
  Book.init({
    /**
     * @memberof module:models.Book
     * @instance
     * @type {String}
    */
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: title.notEmpty },
        notNull: { msg: title.notNull }
      }
    },
    /**
     * @memberof module:models.Book
     * @instance
     * @type {String}
    */
    author: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: author.notEmpty },
        notNull: { msg: author.notNull }
      }
    },
    /**
     * @memberof module:models.Book
     * @instance
     * @type {String}
    */
    genre: Sequelize.STRING,
    /**
     * @memberof module:models.Book
     * @instance
     * @type {Number}
    */
    year: Sequelize.INTEGER
  }, { sequelize });

  Book.associate = models => {
    Book.hasMany(models.Loan, {
      foreignKey: { name: 'book_id', allowNull: false }
    });
  };
  
  return Book;
};
