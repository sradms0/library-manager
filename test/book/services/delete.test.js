'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.book.delete', () => {
  let book;

  before('reload', async () => {
    await testOps.loadTestDb();
  });

  beforeEach('fetch first available book to delete', async () => {
    ({ rows: [book] } = await bookService.readAll());
  });

  it('it should return a promise', async () => {
    expect(bookService.delete(book) instanceof Promise).to.be.true;
  });

  it('it should return a promise resolving to the Book instance deleted', async () => {
    expect((await bookService.delete(book)) instanceof bookService.model).to.be.true;
  });

  it('it should delete an existing book', async () => {
    const { id } = book;
    await bookService.delete(book);
    expect(await bookService.readByPk(id)).to.be.null;
  });
});

