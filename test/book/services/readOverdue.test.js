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



describe('services.book.readOverdue', () => {
  const { Op } = require('sequelize');

  const where = {
    [Op.and]: [
      { '$Loans.returned_on$': null },
      { '$Loans.return_by$': { [Op.lt]: new Date() } }
    ]}, include = { model: loanService.model };

  let overdue;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');

    const { Data: {getFutureOrPastDate: fOP} } = testOps,
          today = new Date();

    overdue = await testOps.Data.addLoans(
      loanService.create, 
      bookService.create, 
      patronService.create,
      20, { 
        loaned_on: fOP(today, -2),
        return_by: fOP(today, -1)
      }
    );
  });

  it('it should return a Promise', () => {
    expect(bookService.readOverdue() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a book total', async () => {
    const { count, rows } = await bookService.readOverdue();
    expect(count).to.equal(overdue.length);
  });

  it('it should return a Promise resolving to an object with an array of Book instances', async () => {
    const { rows } = await bookService.readOverdue();
    rows.forEach(book => expect(book instanceof bookService.model).to.be.true);
  });

  it('it should return only overdue books from the database', async () => {
    const { count: overdueBookCount, rows: overdueBooks} = await bookService.readOverdue(),
          expectedOverdueBooks = await bookService.model.findAll({ where, include });

    const matched = overdueBookCount === expectedOverdueBooks.length && 
                    expectedOverdueBooks.every((eOB, idx) => eOB.title === overdueBooks[idx].title);
    expect(matched).to.be.true;
  });

  describe('limit and offset', async () => {
    let allOverdueBooks, limitedBooks, 
        offset = 0, limit = 0;

    before('fetch all overdue books', async () => {
      allOverdueBooks = await bookService.model.findAll({ where, include });
    });

    describe('limit', async () => {
      it('it should return a limit of one book', async () => {
        limit = 1;
        let [ { title: firstTitle } ] = allOverdueBooks?.slice(offset,limit);
        let { rows: [ {title: limitedFirstTitle} ]} = await bookService.readOverdue({ offset, limit });
        expect(firstTitle).to.equal(limitedFirstTitle);
      });

      it('it should return a limit of some books', async () => {
        limit = Math.ceil(allOverdueBooks.length/2);
        const someBooks = allOverdueBooks?.slice(offset,limit);
        limitedBooks = await bookService.readOverdue({ offset, limit });
        someBooks.forEach((book, idx) =>  expect(book.title === limitedBooks.rows[idx].title));
      });

      it('it should return a limit of no books', async () => {
        limit = offset = 0;
        let { rows: noBooks } = await bookService.readOverdue({ offset, limit });
        expect(noBooks).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one book with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ { title: secondTitle } ] = allOverdueBooks?.slice(offset,limit+1);
        const { rows: [ {title: limitedSecondTitle} ] } = await bookService.readOverdue({ offset, limit });
        expect(secondTitle).to.equal(limitedSecondTitle);
      });

      it('it should return a limit of some books with an offset greater than zero', async () => {
        limit = Math.ceil(allOverdueBooks.length/2);
        const someBooks = allOverdueBooks?.slice(limit+1);
        limitedBooks = await bookService.readOverdue({ offset, limit });
        someBooks.forEach((book, idx) => expect(book.title === limitedBooks.rows[idx].title));
      });

      it('it should return a limit of no books with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noBooks } = await bookService.readOverdue({ offset, limit });
        expect(noBooks).to.be.empty;
      });
    });
  });
});

