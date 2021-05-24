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

  it('it should return a Promise resolving to an object with a book total', async () => {
    const { count } = await bookService.readAll();
    expect(count).to.equal(testOps.Data.book.length);
  });

  it('it should return a Promise resolving to an object with an array of Book instances', async () => {
    const { rows } = await bookService.readAll();
    rows.forEach(book => expect(book instanceof bookService.model).to.be.true);
  });

  it('it should return all books from the database', async () => {
    const { count: dbBookCount, rows: dbBooks} = await bookService.readAll(),
          rawBooks = testOps.Data.book;

    const matched = dbBookCount === rawBooks.length && 
                    rawBooks.every((rb, idx) => rb.title === dbBooks[idx].title);
    expect(matched).to.be.true;
  });

  describe('limit and offset', async () => {
    let allBooks, limitedBooks, 
        offset = 0, limit = 0;

    before('create more instances for pagination', async () => {
      const total = 20;
      for (let i = 0; i < total; i++) {
        await bookService.create({ 
          title: `title ${i}`,
          author: `author ${i}`,
          genre: `genre ${i}`,
          year: i
        });
      }
      ({ rows: allBooks } = await bookService.readAll());
    });

    describe('limit', async () => {
      it('it should return a limit of one book', async () => {
        limit = 1;
        let [ { title: firstTitle } ] = allBooks?.slice(offset,limit);
        let { rows: [ {title: limitedFirstTitle} ]} = await bookService.readAll({ offset, limit });
        expect(firstTitle).to.equal(limitedFirstTitle);
      });

      it('it should return a limit of some books', async () => {
        limit = Math.ceil(allBooks.length/2);
        const someBooks = allBooks?.slice(offset,limit);
        limitedBooks = await bookService.readAll({ offset, limit });
        someBooks.forEach((book, idx) =>  expect(book.title === limitedBooks.rows[idx].title));
      });

      it('it should return a limit of no books', async () => {
        limit = offset = 0;
        let { rows: noBooks } = await bookService.readAll({ offset, limit });
        expect(noBooks).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one book with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ { title: secondTitle } ] = allBooks?.slice(offset,limit+1);
        const { rows: [ {title: limitedSecondTitle} ] } = await bookService.readAll({ offset, limit });
        expect(secondTitle).to.equal(limitedSecondTitle);
      });

      it('it should return a limit of some books with an offset greater than zero', async () => {
        limit = Math.ceil(allBooks.length/2);
        const someBooks = allBooks?.slice(limit+1);
        limitedBooks = await bookService.readAll({ offset, limit });
        someBooks.forEach((book, idx) => expect(book.title === limitedBooks.rows[idx].title));
      });

      it('it should return a limit of no books with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noBooks } = await bookService.readAll({ offset, limit });
        expect(noBooks).to.be.empty;
      });
    });
  });
});

