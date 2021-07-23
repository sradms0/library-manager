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


describe('services.loan.readByAttrs.loan', async () => {
  const loanModelAttrs = testOps.Data
    .getModelAttrs(loanService.model, { without: [
      'book_id',
      'createdAt',
      'id',
      'patron_id',
      'updatedAt'
  ]});

  const dateToStr = date => date.toLocaleDateString('en-CA', { timeZone: 'UTC' });

  let loanedOn;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
    const { rows: [{ loaned_on }] } = await loanService.readAll();
    loanedOn = dateToStr(loaned_on);
  });

  it('it should return a promise', async () => {
    expect(loanService.readByAttrs({ query: loanedOn }) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a loans total', async () => {
    const { count } = await loanService.readByAttrs({ query: loanedOn });
    expect(count).to.equal(testOps.Data.loan.length);
  });

  it('it should return a Promise resolving to an object with an array of searched Loan instances', async () => {
    const { rows } = await loanService.readByAttrs({ query: loanedOn });
    rows.forEach(loan => expect(loan instanceof loanService.model).to.be.true);
  });

  describe('one loan result', async () => {
    const oneAndFound = (searchRes, loan) => 
      searchRes?.length === 1 && 
      JSON.stringify(searchRes?.[0]) === JSON.stringify(loan);

    let oneLoan;
    before('make one unique loan outside of normal date range (use 2wk range)', async () => {
      await testOps.Data.loadTestDb();
      ({ rows: [oneLoan] } = await loanService.readAll());
      if (oneLoan) {
        const lastWeek = testOps.Data.getFutureOrPastDate(new Date(), -14),
              today = new Date(),
              twoWeeksFromLastWeek = testOps.Data.getFutureOrPastDate(lastWeek, 14);

        oneLoan = await loanService.update(oneLoan, { 
          loaned_on: lastWeek, 
          return_by: twoWeeksFromLastWeek,
          returned_on: today
        });
      }
    });

    loanModelAttrs.forEach(attr => {
      it(`it should find one loan by ${attr}`, async () => {
        const dateStr = dateToStr(oneLoan[attr]),
              { rows: searched } = await loanService.readByAttrs({ query: dateStr }),
              res = oneAndFound(searched, oneLoan);
        expect(res).to.be.true;
      });
    });
  });

  describe('many loan results', async () => {
    const manyAndFound = (searchRes, loans) => 
      searchRes?.length === loans.length && searchRes.every((res, idx) => 
        JSON.stringify(res.dataValues) === JSON.stringify(loans[idx].dataValues)
    )

    const yesterday = testOps.Data.getFutureOrPastDate(new Date(), -1),
          today = new Date(),
          nextWeek = testOps.Data.getFutureOrPastDate(yesterday, 7),
          nonUniqueData = { 
            loaned_on: yesterday, 
            return_by: nextWeek, 
            returned_on: today
          };
    let manyLoans = [];

    before('create loans of identical attrs. with books and patrons', async () => {
      await testOps.Data.loadTestDb(null);

      const bookData = testOps.Data.bookData(),
            loanData = testOps.Data.loanData(),
            totalSimilar = 5;

      await testOps.Data.addPatrons(patronService.create, totalSimilar);
      for (let i = 0; i < totalSimilar; i++) {
        const { id } = await bookService.create({ ...bookData() });
        await loanService.create( await loanData({ set: {...nonUniqueData} }) );
        manyLoans.push( await loanService.readByPk(id) );
      }
    });

    loanModelAttrs.forEach((attr, idx) => {
      it(`it should find many loans by ${attr}`, async () => {
        const { rows: searched } = await loanService.readByAttrs({ query: dateToStr(nonUniqueData[attr]) }),
              res = manyAndFound(searched, manyLoans);
        expect(res).to.be.true;
      });
    });
  });

  describe('no loan results', async () => {
    it('it should find no loans', async () => {
      const { rows: searched } = await loanService.readByAttrs({ query: null });
      expect(searched).to.be.empty;
    });
  });


  describe('limit and offset', async () => {
    const { Op } = require('sequelize');
    const { model } = loanService,
          { sequelize } = model;

    const whereWithQuery = query => sequelize.where(sequelize.fn('date', sequelize.col('loaned_on')), { [Op.like]: `%${query}%` }),
          include  = [ bookService.model, patronService.model ];

    const modelSearch = async query => await model.findAndCountAll({ where: whereWithQuery(query), include, subQuery:false });

    const similarLoanedOnDates = new Date();

    let allSearchedLoans, 
        limitedSearchedLoans, 
        offset = 0, 
        limit = 0;

    before('create more instances for pagination', async () => {
      await testOps.Data.loadTestDb(null);
      await testOps.Data.addLoans(
        loanService.create,
        bookService.create,
        patronService.create,
        20,
        { loaned_on: similarLoanedOnDates }
      );
      ({ rows: allSearchedLoans } = await modelSearch( dateToStr(similarLoanedOnDates) ));
    });

    describe('limit', async () => {
      it('it should return a limit of one searched-loan', async () => {
        limit = 1;
        const firstSearchedLoan = allSearchedLoans?.slice(offset,limit);
        limitedSearchedLoans = await loanService.readByAttrs({ query: dateToStr(similarLoanedOnDates), limit, offset });

        const limitCreated = limitedSearchedLoans.rows.length === firstSearchedLoan.length &&
          firstSearchedLoan[0].Patron.name === limitedSearchedLoans.rows[0].Patron.name;
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of some searched-loans', async () => {
        limit = Math.ceil(allSearchedLoans.length/2);
        const someSearchedLoans = allSearchedLoans?.slice(offset,limit);
        limitedSearchedLoans = await loanService.readByAttrs({ query: dateToStr(similarLoanedOnDates), limit, offset });

        const limitCreated = limitedSearchedLoans.rows.length === someSearchedLoans.length &&
          someSearchedLoans.every((loan, idx) => loan.last_name === limitedSearchedLoans.rows[idx].last_name);
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of no searched-loans', async () => {
        limit = offset = 0;
        let { rows: noSearchedLoans } = await loanService.readByAttrs({ query: dateToStr(similarLoanedOnDates), limit, offset });
        expect(noSearchedLoans).to.be.empty;
      });

      describe('offset', async () => {
        it('it should return a limit of one searched-loan with an offset greater than zero', async () => {
          offset = limit = 1;
          const secondSearchedLoan = allSearchedLoans?.slice(offset,limit+1);
          limitedSearchedLoans = await loanService.readByAttrs({ query: dateToStr(similarLoanedOnDates), limit, offset });

          const offsetCreated = limitedSearchedLoans.rows.length === secondSearchedLoan.length &&
            secondSearchedLoan[0].last_name === limitedSearchedLoans.rows[0].last_name;
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of some searched-loans with an offset greater than zero', async () => {
          limit = Math.ceil(allSearchedLoans.length/2);
          const someSearchedLoans = allSearchedLoans?.slice(offset,limit+1);
          limitedSearchedLoans = await loanService.readByAttrs({ query: dateToStr(similarLoanedOnDates), limit, offset });

          const offsetCreated = limitedSearchedLoans.rows.length === someSearchedLoans.length &&
            someSearchedLoans.every((loan, idx) => loan.last_name === limitedSearchedLoans.rows[idx].last_name);
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of no loans with an offset equal to the searched-loans length', async () => {
          const { count } = await modelSearch(dateToStr(similarLoanedOnDates));
          limit = 10, offset = count;
          const { rows: noLoans } = await loanService.readByAttrs({ query: dateToStr(similarLoanedOnDates), limit, offset });
          expect(noLoans).to.be.empty;
        });
      });
    });
  });
});

