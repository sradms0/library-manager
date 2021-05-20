'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.book.create', () => {
  it('it should return a promise', () => {
    const bookData1 = { 
      title: 'title1', 
      author: 'author1',
      genre: 'genre1',
      year: 1
    };
    expect(bookService.create(bookData1) instanceof Promise).to.be.true;
  });

  it('it should create one book', async () => {
    const bookData2 = { 
      title: 'title2', 
      author: 'author2',
      genre: 'genre2',
      year: 2
    };

    const book = (await bookService.create(bookData2))?.toJSON(),
          { count, rows } = await bookService.model.findAndCountAll({ where: {title: 'title2'} }),
          bookReturned = rows?.[0]?.toJSON();
    const wasCreated = Object.keys(testOps.Data.book)
                        .every(prop => bookData2[prop] === bookReturned?.[prop]);

    expect(count === 1 && wasCreated).to.be.true;
  });

  it('it should throw an error when an empty title is given', async () => {
    await expect(bookService.create({ title: '', author: 'author' })).to.be.rejectedWith('"Title" is required');
  });

  it('it should throw an error when a title property doesn\'t exist', async () => {
    await expect(bookService.create({ author: 'author' })).to.be.rejectedWith('"Title" field is required');
  });

  it('it should throw an error when an empty author is given', async () => {
    await expect(bookService.create({ title: 'title', author: '' })).to.be.rejectedWith('"Author" is required');
  });

  it('it should throw an error when an author property doesn\'t exist', async () => {
    await expect(bookService.create({ title: 'title' })).to.be.rejectedWith('"Author" field is required');
  });

  it('it should throw an error when both empty title and author is given', async () => {
    await expect(bookService.create({ title: '', author: '' }))
          .to.be.rejectedWith('Validation error: "Title" is required,\nValidation error: "Author" is required');
  });

  it('it should throw an error when both title and author properties don\'t exist', async () => {
    await expect(bookService.create({}))
          .to.be.rejectedWith('notNull Violation: "Title" field is required,\nnotNull Violation: "Author" field is required');
  });
});

