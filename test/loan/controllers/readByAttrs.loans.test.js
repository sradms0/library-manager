'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/loans');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { 
  book: bookService,
  loan: loanService, 
  patron: patronService 
} = require('$services');

const { loan: loanController } = require('$controllers');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.loan.readByAttrs.loans', () => {
  const loanModelAttrs = testOps.Data
    .getModelAttrs(loanService.model, { without: [
      'book_id',
      'createdAt',
      'id',
      'patron_id',
      'updatedAt'
  ]});

  const dateToStr = date => date.toLocaleDateString('en-CA', { timeZone: 'UTC' });

  describe('one loan result', async () => {
    let oneLoan;
    let page, limit;
    before('make one unique loan outside of normal date range (use 2wk range)', async () => {
      await testOps.Data.loadTestDb();
      ({ rows: [oneLoan] } = await loanService.readAll());
      if (oneLoan) {
        const lastWeek = testOps.Data.getFutureOrPastDate(new Date(), -14),
              today = new Date(),
              twoWeeksFromLastWeek = testOps.Data.getFutureOrPastDate(lastWeek, 14);

        oneLoan = [await loanService.update(oneLoan, { 
          loaned_on: lastWeek, 
          return_by: twoWeeksFromLastWeek,
          returned_on: today
        })];
      }
    });
    loanModelAttrs.forEach(attr => {
      it(`it should render one searched loan by its ${attr}`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: dateToStr(oneLoan[0][attr])} });
        await loanController.readByAttrs(req, res);

        const { args: [[ template, { loans: rLoans }]] } = res.render;

        const calledWithExpectedArgs = template === 'loan/index' &&
          rLoans.length === 1 &&
          JSON.stringify(oneLoan[0][attr]) === JSON.stringify(rLoans[0][attr])

        expect(calledWithExpectedArgs).to.be.true;
      });
    });
  });

  describe('many loan results', async () => {
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
      it(`it should render many searched loans by their ${attr} value`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: dateToStr(nonUniqueData[attr])} });
        await loanController.readByAttrs(req, res);

        const { args: [[ template, { loans: rLoans }]] } = res.render;

        const calledWithExpectedArgs = template === 'loan/index' &&
          rLoans.length === manyLoans.length &&
          manyLoans.every((loan, idx) => 
            JSON.stringify(loan) === JSON.stringify(rLoans[idx])
          );

        expect(calledWithExpectedArgs).to.be.true;
      });
    });
  });

  describe('no loan results', async () => {
    it('it should render no loans', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: null} });
      await loanController.readByAttrs(req, res);

      const { args: [[ template, { loans: rLoans }]] } = res.render;

      const calledWithExpectedArgs = template === 'loan/index' && rLoans.length === 0;
      expect(calledWithExpectedArgs).to.be.true;
    });
  });

  describe('pagination parameters', () => {
    const qplPath = (q, page, limit) => `/loans/search?q=${q}&page=${page}&limit=${limit}`,
          similarLoanedOnDates = new Date(),
          q = dateToStr(similarLoanedOnDates);

    let page, 
        limit, 
        res;

    before('create more instances for pagination', async () => {
      await testOps.Data.loadTestDb(null);
      await testOps.Data.addLoans(
        loanService.create,
        bookService.create,
        patronService.create,
        20,
        { loaned_on: similarLoanedOnDates }
      );
    });


    beforeEach('', () => {
      res = mockResponse();
    });

    it('it should call res.render with loan/index and a limited/offset loans object with pagination configuration', async () => {
      page = 1, limit = 10;
      const req = mockRequest({ query: {q, page, limit} });
      const { rows: loans, count } = await loanService.readByAttrs({ query: q, limit, offset: page*limit-limit });
      const totalPages = Math.ceil(count/limit);
      await loanController.readByAttrs(req, res);

      expect(res.render).to.have.been.calledWith('loan/index', { loans, page, limit, totalPages, paginationRoot: `/loans/search?q=${q}&`});
    });

  it('it should call res.render with loan/index and only an all loans object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {q, page, limit} });
    const { rows: loans } = await loanService.readByAttrs({ query: q });
    await loanController.readByAttrs(req, res);
    expect(res.render).to.have.been.calledWith('loan/index', { loans });
  });

    it('it should redirect to /loans/search?q={q}&page={page}&limit={limit} when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await loanController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, 1, limit));
  });

  it('it should redirect to /loans/search?q={q}&page={page}&limit={limit} when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await loanController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, -1*page, limit));
  });

  it('it should redirect to /loans/search?q={q}&page={page}&limit={limit} when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {q, page, limit} });
    await loanController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, page, 10));
  });

  it('it should redirect to /loans/search?q={q}&page={page}&limit={limit} when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {q, page, limit} });
    await loanController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, page, -1*limit));
  });

  it('it should redirect to /loans/search?q={q}&page={page}&limit={limit} when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await loanController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, 1, limit));
  });

  it('it should redirect to /loans/search?q={q}&page={page}&limit={limit} when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {q, page, limit} });
    await loanController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, page, 10));
  });

  it('it should redirect to /loans/search?q={q}&page={page}&limit={limit} when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {q, page, limit} });
    await loanController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, -1*page, -1*limit));
  });
  })
});
