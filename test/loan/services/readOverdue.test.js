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



describe('services.loan.readOverdue', () => {
  const { Op } = require('sequelize');

  const where = {
    [Op.and]: [
      { returned_on: null },
      { return_by: { [Op.lt]: new Date() } }
    ]}, include = [ bookService.model, patronService.model ];

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
    expect(loanService.readOverdue() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a loans total', async () => {
    const { count, rows } = await loanService.readOverdue();
    expect(count).to.equal(overdue.length);
  });

  it('it should return a Promise resolving to an object with an array of Loan instances', async () => {
    const { rows } = await loanService.readOverdue();
    rows.forEach(loan => expect(loan instanceof loanService.model).to.be.true);
  });

  it('it should return only overdue loans from the database', async () => {
    const { count: overdueLoanCount, rows: overdueLoans} = await loanService.readOverdue(),
          expectedOverdueLoans = await loanService.model.findAll({ where, include });

    const matched = overdueLoanCount === expectedOverdueLoans.length && 
                    expectedOverdueLoans.every((eOB, idx) => eOB.title === overdueLoans[idx].title);
    expect(matched).to.be.true;
  });

  it('it should return all overdue loans from the database, each loan containing associated book data', async () => {
    const { count: overdueLoanCount, rows: overdueLoans} = await loanService.readOverdue(),
          expectedOverdueLoans = await loanService.model.findAll({ where, include });

    expectedOverdueLoans.forEach((loan, idx) => {
      const loanedBook = overdueLoans[idx].Book;
      expect(JSON.stringify(loan?.Book)).to.equal(JSON.stringify(loanedBook));
    });
  });

  it('it should return all loans from the database, each loan containing associated patron data', async () => {
    const { count: overdueLoanCount, rows: overdueLoans} = await loanService.readOverdue(),
          expectedOverdueLoans = await loanService.model.findAll({ where, include });

    expectedOverdueLoans.forEach((loan, idx) => {
      const loanedPatron = overdueLoans[idx].Patron;
      expect(JSON.stringify(loan?.Patron)).to.equal(JSON.stringify(loanedPatron));
    });
  });

  describe('limit and offset', async () => {
    let allOverdueLoans, limitedLoans, 
        offset = 0, limit = 0;

    before('fetch all overdue loans', async () => {
      allOverdueLoans = await loanService.model.findAll({ where, include });
    });

    describe('limit', async () => {
      it('it should return a limit of one loan', async () => {
        limit = 1;
        let [ {Book: { title: firstTitle }} ] = allOverdueLoans?.slice(offset,limit);
        let { rows: [ {Book: {title: limitedFirstTitle}} ]} = await loanService.readOverdue({ offset, limit });
        expect(firstTitle).to.equal(limitedFirstTitle);
      });

      it('it should return a limit of some loans', async () => {
        limit = Math.ceil(allOverdueLoans.length/2);
        const someLoans = allOverdueLoans?.slice(offset,limit);
        limitedLoans = await loanService.readOverdue({ offset, limit });
        someLoans.forEach((loan, idx) =>  expect(loan.Book.title === limitedLoans.rows[idx].Book.title));
      });

      it('it should return a limit of no loans', async () => {
        limit = offset = 0;
        let { rows: noLoans } = await loanService.readOverdue({ offset, limit });
        expect(noLoans).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one loan with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ {Book: { title: secondTitle }} ] = allOverdueLoans?.slice(offset,limit+1);
        const { rows: [ {Book: {title: limitedSecondTitle}} ] } = await loanService.readOverdue({ offset, limit });
        expect(secondTitle).to.equal(limitedSecondTitle);
      });

      it('it should return a limit of some loans with an offset greater than zero', async () => {
        limit = Math.ceil(allOverdueLoans.length/2);
        const someLoans = allOverdueLoans?.slice(limit+1);
        limitedLoans = await loanService.readOverdue({ offset, limit });
        someLoans.forEach((loan, idx) => expect(loan.Book.title === limitedLoans.rows[idx].Book.title));
      });

      it('it should return a limit of no loans with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noLoans } = await loanService.readOverdue({ offset, limit });
        expect(noLoans).to.be.empty;
      });
    });
  });
});

