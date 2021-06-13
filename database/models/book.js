'use strict';

const Sequelize = require('sequelize');
const { sequelize } = require('./');
const { book: { messages: { title, author } }} = require('./validationMessages');


module.exports = sequelize => {
  class Book extends Sequelize.Model {};
  Book.init({
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: title.notEmpty },
        notNull: { msg: title.notNull }
      }
    },
    author: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: author.notEmpty },
        notNull: { msg: author.notNull }
      }
    },
    genre: Sequelize.STRING,
    year: Sequelize.INTEGER
  }, { sequelize });

  Book.associate = models => {
    Book.hasMany(models.Loan, {
      foreignKey: { name: 'book_id', allowNull: false }
    });
  };
  
  return Book;
};
