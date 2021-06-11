'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService, loan: loanService, patron: patronService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

const { asyncUtil: {asyncForEach} } = require('$root/lib');

describe('services.loan.readAll', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });

  it('it should return a Promise', () => {
    expect(loanService.readAll() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a loan total', async () => {
    const { count } = await loanService.readAll();
    expect(count).to.equal(testOps.Data.loan.length);
  });

  it('it should return a Promise resolving to an object with an array of Loan instances', async () => {
    const { rows } = await loanService.readAll();
    rows.forEach(loan => expect(loan instanceof loanService.model).to.be.true);
  });

  it('it should return all loans from the database', async () => {
    const { count: dbLoanCount, rows: dbLoans} = await loanService.readAll(),
          rawLoans = testOps.Data.loan;

    const matched = dbLoanCount === rawLoans.length && 
                    rawLoans.every((rl, idx) => rl.book_id === dbLoans[idx].book_id);
    expect(matched).to.be.true;
  });

  it('it should return all loans from the database, each loan containing associated book data', async () => {
    const { count: dbLoanCount, rows: dbLoans} = await loanService.readAll(),
          rawLoans = testOps.Data.loan,
          loanedBookIds = rawLoans.map(rl => rl.book_id),
          loanedBooks = [];
    await asyncForEach(loanedBookIds, async id => loanedBooks.push( await bookService.readByPk(id) ));

    dbLoans.forEach((loan, idx) => {
      const loanedBook = loanedBooks[idx];
      expect(JSON.stringify(loan?.Book)).to.equal(JSON.stringify(loanedBook));
    });
  });

  it('it should return all loans from the database, each loan containing associated patron data', async () => {
    const { count: dbLoanCount, rows: dbLoans} = await loanService.readAll(),
          rawLoans = testOps.Data.loan,
          loanedPatronIds = rawLoans.map(rl => rl.patron_id),
          loanedPatrons = [];
    await asyncForEach(loanedPatronIds, async id => loanedPatrons.push( await patronService.readByPk(id) ));

    dbLoans.forEach((loan, idx) => {
      const loanedPatron = loanedPatrons[idx];
      expect(JSON.stringify(loan?.Patron)).to.equal(JSON.stringify(loanedPatron));
    });
  });


  describe('limit and offset', async () => {
    let allLoans, limitedLoans, 
        offset = 0, limit = 0;

    before('create more instances for pagination', async () => {
      await testOps.Data.addLoans(
        loanService.model,
        bookService.create, 
        patronService.create,
        20
      );
      ({ rows: allLoans } = await loanService.readAll());
    });

    describe('limit', async () => {
      it('it should return a limit of one loan', async () => {
        limit = 1;
        let [ { title: firstTitle } ] = allLoans?.slice(offset,limit);
        let { rows: [ {title: limitedFirstTitle} ]} = await loanService.readAll({ offset, limit });
        expect(firstTitle).to.equal(limitedFirstTitle);
      });

      it('it should return a limit of some loans', async () => {
        limit = Math.ceil(allLoans.length/2);
        const someLoans = allLoans?.slice(offset,limit);
        limitedLoans = await loanService.readAll({ offset, limit });
        someLoans.forEach((loan, idx) =>  expect(loan.title === limitedLoans.rows[idx].title));
      });

      it('it should return a limit of no loans', async () => {
        limit = offset = 0;
        let { rows: noLoans } = await loanService.readAll({ offset, limit });
        expect(noLoans).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one loan with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ { title: secondTitle } ] = allLoans?.slice(offset,limit+1);
        const { rows: [ {title: limitedSecondTitle} ] } = await loanService.readAll({ offset, limit });
        expect(secondTitle).to.equal(limitedSecondTitle);
      });

      it('it should return a limit of some loans with an offset greater than zero', async () => {
        limit = Math.ceil(allLoans.length/2);
        const someLoans = allLoans?.slice(limit+1);
        limitedLoans = await loanService.readAll({ offset, limit });
        someLoans.forEach((loan, idx) => expect(loan.title === limitedLoans.rows[idx].title));
      });

      it('it should return a limit of no loans with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noLoans } = await loanService.readAll({ offset, limit });
        expect(noLoans).to.be.empty;
      });
    });
  });
});

