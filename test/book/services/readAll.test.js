'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.book.readAll', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });

  it('it should return a Promise', () => {
    expect(bookService.readAll() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an array of all Book instances', async () => {
    const books = await bookService.readAll();
    books.forEach(book => expect(book instanceof bookService.model).to.be.true);
  });

  it('it should return all books from the database', async () => {
    const dbBooks = await bookService.readAll(),
          rawBooks = testOps.Data.book;

    const matched = dbBooks.length === rawBooks.length && 
                    rawBooks.every((rb, idx) => rb.title === dbBooks[idx].title);
    expect(matched).to.be.true;
  });
});

