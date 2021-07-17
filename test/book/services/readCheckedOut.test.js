'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

const { 
  book: bookService, 
  loan: loanService,
  patron: patronService 
} = require('$services');



describe('services.book.readCheckedOut', () => {
  const { Op } = require('sequelize');

  const where = { '$Loans.returned_on$': null }, include = { model: loanService.model };

  let checkedOut;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');

    const { Data: {getFutureOrPastDate: fOP} } = testOps,
          today = new Date();

    await testOps.Data.addLoans(
      loanService.create, 
      bookService.create, 
      patronService.create,
      20, { 
        loaned_on: fOP(today, -2),
        return_by: fOP(today, -1)
      }
    );
    checkedOut = await bookService.model.findAll({ where, include });
  });

  it('it should return a Promise', () => {
    expect(bookService.readCheckedOut() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a book total', async () => {
    const { count, rows } = await bookService.readCheckedOut();
    expect(count).to.equal(checkedOut.length);
  });

  it('it should return a Promise resolving to an object with an array of Book instances', async () => {
    const { rows } = await bookService.readCheckedOut();
    rows.forEach(book => expect(book instanceof bookService.model).to.be.true);
  });

  it('it should return only checkedOut books from the database', async () => {
    const { count: checkedOutBookCount, rows: checkedOutBooks} = await bookService.readCheckedOut(),
          expectedCheckedOutBooks = await bookService.model.findAll({ where, include });

    const matched = checkedOutBookCount === expectedCheckedOutBooks.length && 
                    expectedCheckedOutBooks.every((eOB, idx) => eOB.title === checkedOutBooks[idx].title);
    expect(matched).to.be.true;
  });

  describe('limit and offset', async () => {
    let allCheckedOutBooks, limitedBooks, 
        offset = 0, limit = 0;

    before('fetch all checked out books', async () => {
      allCheckedOutBooks = await bookService.model.findAll({ where, include });
    });

    describe('limit', async () => {
      it('it should return a limit of one book', async () => {
        limit = 1;
        let [ { title: firstTitle } ] = allCheckedOutBooks?.slice(offset,limit);
        let { rows: [ {title: limitedFirstTitle} ]} = await bookService.readCheckedOut({ offset, limit });
        expect(firstTitle).to.equal(limitedFirstTitle);
      });

      it('it should return a limit of some books', async () => {
        limit = Math.ceil(allCheckedOutBooks.length/2);
        const someBooks = allCheckedOutBooks?.slice(offset,limit);
        limitedBooks = await bookService.readCheckedOut({ offset, limit });
        someBooks.forEach((book, idx) =>  expect(book.title === limitedBooks.rows[idx].title));
      });

      it('it should return a limit of no books', async () => {
        limit = offset = 0;
        let { rows: noBooks } = await bookService.readCheckedOut({ offset, limit });
        expect(noBooks).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one book with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ { title: secondTitle } ] = allCheckedOutBooks?.slice(offset,limit+1);
        const { rows: [ {title: limitedSecondTitle} ] } = await bookService.readCheckedOut({ offset, limit });
        expect(secondTitle).to.equal(limitedSecondTitle);
      });

      it('it should return a limit of some books with an offset greater than zero', async () => {
        limit = Math.ceil(allCheckedOutBooks.length/2);
        const someBooks = allCheckedOutBooks?.slice(limit+1);
        limitedBooks = await bookService.readCheckedOut({ offset, limit });
        someBooks.forEach((book, idx) => expect(book.title === limitedBooks.rows[idx].title));
      });

      it('it should return a limit of no books with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noBooks } = await bookService.readCheckedOut({ offset, limit });
        expect(noBooks).to.be.empty;
      });
    });
  });
});

