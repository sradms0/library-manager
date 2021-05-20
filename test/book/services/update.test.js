'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService } = require('$services');
const { loader } = require('$seed/books');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

chai.use(require('chai-as-promised'));


describe('services.book.update', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });

  it('it should return a promise', async () => {
    const book = await bookService.readByPk(1);
    const updatedBookData1 = {
      title: 'updated title1', 
      author: 'updated author1',
      genre: 'updated genre1',
      year: 1
    };

    expect(bookService.update(book, updatedBookData1) instanceof Promise).to.be.true;
  });

  it('it should update one book', async () => {
    const book = await bookService.readByPk(2);
    const updatedBookData2 = {
      title: 'updated title2', 
      author: 'updated author2',
      genre: 'updated genre2',
      year: 2
    };

    const updated = (await bookService.update(book, updatedBookData2))?.toJSON();
    const wasUpdated = Object.keys(updatedBookData2)
      .forEach(key => expect(updated?.[key]).to.equal(updatedBookData2[key]));
  });

  let errBook;
  before('', async () => {
    errBook = await bookService.readByPk(3);
  })

  it('it should throw an error when an empty title is given', async () => {
    await expect(bookService.update(errBook, { title: '', author: 'author' })).to.be.rejectedWith('"Title" is required');
  });

  it('it should throw an error when an empty author is given', async () => {
    await expect(bookService.update(errBook, { title: 'title', author: '' })).to.be.rejectedWith('"Author" is required');
  });

  it('it should throw an error when both empty title and author is given', async () => {
    await expect(bookService.update(errBook, { title: '', author: '' }))
          .to.be.rejectedWith('Validation error: "Title" is required,\nValidation error: "Author" is required');
  });
});

