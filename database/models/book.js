'use strict';

const Sequelize = require('sequelize');
const { Op } = Sequelize;
const { sequelize } = require('./');

module.exports = sequelize => {
  class Book extends Sequelize.Model {};
  Book.init({
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: '"Title" is required' },
        notNull: { msg: '"Title" field is required' }
      }
    },
    author: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: '"Author" is required' },
        notNull: { msg: '"Author" field is required' }
      }
    },
    genre: Sequelize.STRING,
    year: Sequelize.INTEGER
  }, { sequelize });

  Book.associate = models => {
    Book.hasMany(models.Loan, { foreignKey: 'book_id' });
  };
  
  return Book;
};
