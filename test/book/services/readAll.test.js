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

  it('it should return should return all books in ascending title-order', async () => {
    const books = await bookService.readAll({ order: [[ 'title', 'ASC' ]] });
    const sortedBookData = [...testOps.Data.book]
      .sort((b1, b2) => {
        const b1L = b1.title.toLowerCase(), 
              b2L = b2.title.toLowerCase();
        if (b1L < b2L) return -1;
        if (b1L > b2L) return 1;
        return 0;
      });
    books.forEach((dbBook, idx) => {
      expect(dbBook.title).to.eql(sortedBookData[idx].title)
    });
  });
});

