'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.book.readByPk', async () => {
  const bookData0 = { 
    title: 'title0', 
    author: 'author0',
    genre: 'genre0',
    year: 0
  };
  let id;

  it('create book to find', async () => {
    id  = (await bookService.model.create(bookData0)).id;
  });

  it('it should return a Promise', async () => {
    expect(bookService.readByPk(id) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to a Book instance', async () => {
    expect((await bookService.readByPk(id)) instanceof bookService.model).to.be.true;
  });

  it('it should return null when finding a non-existent book primary key', async () => {
    expect(await bookService.readByPk(-1)).to.be.null;
  });
});

