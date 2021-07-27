'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/loans');
const { expect } = chai;
const server = require('$root/app');

const { testOperations: testOps } = require('$test/lib');
const { asyncUtil: {asyncForEach} } = require('$root/lib');

const { 
  book: bookService,
  loan: loanService, 
  patron: patronService 
} = require('$services');

const { loan: loanController } = require('$controllers');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.loan.readByAttrs.patrons', () => {
  const patronModelAttrs = testOps.Data.getModelAttrs(patronService.model, { without: [
    'address', 
    'createdAt', 
    'email', 
    'id', 
    'library_id',
    'zip_code',
    'updatedAt'
  ]});

  let name;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
    ({ rows: [{ Patron: { name } }] } = await loanService.readAll());
  });

  describe('one patron-loanee result', async () => {
    let onePatronLoanee,
        page, 
        limit;
    
    before('make one unique name for a patron-loanee', async () => {
      ({ rows: [{ Patron: onePatronLoanee }] } = await loanService.readAll());
      if (onePatronLoanee) {
        onePatronLoanee = [await patronService.update(
          onePatronLoanee, { 
            last_name: 'uniquelast', 
            last_name: 'uniquelast' 
          })];
      }
    });

    patronModelAttrs.forEach(attr => {
      it(`it should render one searched patron-loanee by its ${attr} value`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: onePatronLoanee[0][attr]} });
        await loanController.readByAttrs(req, res);

        const { args: [[ template, { loans: rLoans }]] } = res.render;

        const calledWithExpectedArgs = template === 'loan/index' &&
          rLoans.length === 1 &&
          JSON.stringify(onePatronLoanee[0][attr]) === JSON.stringify(rLoans[0]?.Patron[attr])

        expect(calledWithExpectedArgs).to.be.true;
      });
    });
  });

  describe('many patron-loanee results', async () => {
    let manyLoanedBooks = [];

    const nonUniqueData = { 
      first_name: 'samefirst', 
      last_name: 'samelast',
      name: 'samefirst samelast'
    };
    let manyPatronLoanees = [];

    before('create patron-loanees of identical names with patrons', async () => {
      await testOps.Data.loadTestDb(null);

      const patronData = testOps.Data.patronData(),
            loanData = testOps.Data.loanData(),
            totalSimilar = 5;

      await testOps.Data.addBooks(bookService.create, totalSimilar);
      for (let i = 0; i < totalSimilar; i++) {
        const { id: patron_id } = await patronService.create({ ...patronData({ set:{...nonUniqueData} }) }),
              { id: loanId } = await loanService.create({ ...(await loanData({ set: {patron_id} })) });
        manyPatronLoanees.push( await loanService.readByPk(loanId) );
      }
    });

    patronModelAttrs.forEach((attr, idx) => {
      it(`it should render many searched patron-loanees by their ${attr} value`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: nonUniqueData[attr]} });
        await loanController.readByAttrs(req, res);

        const { args: [[ template, { loans: rLoans }]] } = res.render;

        const calledWithExpectedArgs = template === 'loan/index' &&
          rLoans.length === manyPatronLoanees.length &&
          manyPatronLoanees.every((loan, idx) => 
            JSON.stringify(loan) === JSON.stringify(rLoans[idx])
          );

        expect(calledWithExpectedArgs).to.be.true;
      });
    });
  });

  describe('no patron-loanee results', async () => {
    const loans = []

    it('it should render no patron-loanees', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: null} });
      await loanController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('loan/index', { loans });
    });
  });

  describe('pagination parameters', () => {
    const qplPath = (q, page, limit) => `/loans/search?q=${q}&page=${page}&limit=${limit}`;

    let allSearchedPatronLoanees,
        page, 
        limit, 
        res;

    const similarNameData = { first_name: 'similarfirst', last_name: 'similarlast' },
          similarWholeName = `${similarNameData.first_name} ${similarNameData.last_name}`,
          q = similarNameData.first_name;
    before('create more instances for pagination', async () => {
      await testOps.Data.loadTestDb(null);
      const loanData = testOps.Data.loanData(), total = 20;
      const patronIds = (
        await testOps.Data.addPatrons(
          patronService.create, 
          total, { 
            set: {
            first_name: similarNameData.first_name, 
            last_name: similarNameData.last_name
            }
          }
        )
      ).map(({ id }) => id);
      await testOps.Data.addBooks(bookService.create, total);
      await asyncForEach(patronIds, async patron_id => 
        await loanService.create({ ...(await loanData({ set: {patron_id} })) })
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
  });
});
