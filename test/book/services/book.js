'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { book: bookService } = require('../../../services');
const { expect } = chai;

const { loader } = require('../../../seed/books');
const { sequelize } = require('../../../database/models');
const { models: {Book} } = sequelize;

const bookData = require('../../data/books.json');
const genreData = require('../../data/genres.json');


describe('(Re)Create test database', () => {
  before('testing books', async () => {
    sequelize.options.logging = false;
    await sequelize.sync({ force:true });
    loader.load(bookData, genreData, false);
  });

  it('test-books loaded', async () => {
    const books = await Book.findAll();
    expect(books.length).to.eql(bookData.length);
  });
});


chai.use(chaiAsPromised);

describe('services.book.readAll', () => {
  it('it should return a Promise', () => {
    expect(bookService.readAll() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an array of all books', async () => {
    const books = await bookService.readAll();
    expect(books.length).to.eql(bookData.length);
    books.forEach(book => expect(book instanceof Book).to.be.true);
  });

  it('it should return a Promise resolving to an array of all Book instances', async () => {
    const books = await bookService.readAll();
    books.forEach(book => expect(book instanceof Book).to.be.true);
  });
});
