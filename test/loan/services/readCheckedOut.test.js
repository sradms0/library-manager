'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

const { asyncUtil: { asyncForEach } } = require('$root/lib');

const { 
  book: bookService, 
  loan: loanService,
  patron: patronService 
} = require('$services');



describe('services.loan.readCheckedOut', () => {
  const { Op } = require('sequelize');

  const where = { returned_on: null }, 
        include = [ bookService.model, patronService.model ];

  let checkedOut;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');

    // create loans, but return some
    await testOps.Data.addLoans(
      loanService.create, 
      bookService.create, 
      patronService.create,
      20
    );
    const { rows: dbLoans } = await loanService.readAll({ limit: 10, offset: 1 });
    asyncForEach(dbLoans, async loan => 
      await loanService.update(loan, { returned_on: today })
    );
    checkedOut = await loanService.model.findAll({ where, include });
  });

  it('it should return a Promise', () => {
    expect(loanService.readCheckedOut() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a loans total', async () => {
    const { count, rows } = await loanService.readCheckedOut();
    expect(count).to.equal(checkedOut.length);
  });

  it('it should return a Promise resolving to an object with an array of Loan instances', async () => {
    const { rows } = await loanService.readCheckedOut();
    rows.forEach(loan => expect(loan instanceof loanService.model).to.be.true);
  });

  it('it should return only checked-out loans from the database', async () => {
    const { count: checkedOutLoanCount, rows: checkedOutLoans} = await loanService.readCheckedOut(),
          expectedCheckedOutLoans = await loanService.model.findAll({ where, include });

    const matched = checkedOutLoanCount === expectedCheckedOutLoans.length && 
                    expectedCheckedOutLoans.every((eOB, idx) => eOB.title === checkedOutLoans[idx].title);
    expect(matched).to.be.true;
  });

  it('it should return all checked-out loans from the database, each loan containing associated book data', async () => {
    const { count: checkedOutLoanCount, rows: checkedOutLoans} = await loanService.readCheckedOut(),
          expectedCheckedOutLoans = await loanService.model.findAll({ where, include });

    expectedCheckedOutLoans.forEach((loan, idx) => {
      const loanedBook = checkedOutLoans[idx].Book;
      expect(JSON.stringify(loan?.Book)).to.equal(JSON.stringify(loanedBook));
    });
  });

  it('it should return all checked-out loans from the database, each loan containing associated patron data', async () => {
    const { count: checkedOutLoanCount, rows: checkedOutLoans} = await loanService.readCheckedOut(),
          expectedCheckedOutLoans = await loanService.model.findAll({ where, include });

    expectedCheckedOutLoans.forEach((loan, idx) => {
      const loanedPatron = checkedOutLoans[idx].Patron;
      expect(JSON.stringify(loan?.Patron)).to.equal(JSON.stringify(loanedPatron));
    });
  });

  describe('limit and offset', async () => {
    let allCheckedOutLoans, limitedLoans, 
        offset = 0, limit = 0;

    before('fetch all checked-out loans', async () => {
      allCheckedOutLoans = await loanService.model.findAll({ where, include });
    });

    describe('limit', async () => {
      it('it should return a limit of one loan', async () => {
        limit = 1;
        let [ {Book: { title: firstTitle }} ] = allCheckedOutLoans?.slice(offset,limit);
        let { rows: [ {Book: {title: limitedFirstTitle}} ]} = await loanService.readCheckedOut({ offset, limit });
        expect(firstTitle).to.equal(limitedFirstTitle);
      });

      it('it should return a limit of some loans', async () => {
        limit = Math.ceil(allCheckedOutLoans.length/2);
        const someLoans = allCheckedOutLoans?.slice(offset,limit);
        limitedLoans = await loanService.readCheckedOut({ offset, limit });
        someLoans.forEach((loan, idx) =>  expect(loan.Book.title === limitedLoans.rows[idx].Book.title));
      });

      it('it should return a limit of no loans', async () => {
        limit = offset = 0;
        let { rows: noLoans } = await loanService.readCheckedOut({ offset, limit });
        expect(noLoans).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one loan with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ {Book: { title: secondTitle }} ] = allCheckedOutLoans?.slice(offset,limit+1);
        const { rows: [ {Book: {title: limitedSecondTitle}} ] } = await loanService.readCheckedOut({ offset, limit });
        expect(secondTitle).to.equal(limitedSecondTitle);
      });

      it('it should return a limit of some loans with an offset greater than zero', async () => {
        limit = Math.ceil(allCheckedOutLoans.length/2);
        const someLoans = allCheckedOutLoans?.slice(limit+1);
        limitedLoans = await loanService.readCheckedOut({ offset, limit });
        someLoans.forEach((loan, idx) => expect(loan.Book.title === limitedLoans.rows[idx].Book.title));
      });

      it('it should return a limit of no loans with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noLoans } = await loanService.readCheckedOut({ offset, limit });
        expect(noLoans).to.be.empty;
      });
    });
  });
});

