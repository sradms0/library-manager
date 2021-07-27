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


describe('controllers.loan.readByAttrs.books', () => {
  const bookModelAttrs = testOps.Data.getModelAttrs(bookService.model, { without: [
    'author', 
    'createdAt', 
    'genre', 
    'id', 
    'year', 
    'updatedAt'
  ]});

  let title;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
    ({ rows: [{ Book: { title } }] } = await loanService.readAll());
  });

  describe('one loan-book result', async () => {
    let oneLoanedBook,
        page, 
        limit;
        
    before('make one unique title for a loaned-book', async () => {
      ({ rows: [{ Book: oneLoanedBook }] } = await loanService.readAll());
      if (oneLoanedBook) {
        oneLoanedBook = [await bookService.update(oneLoanedBook, { title: 'unique-title' })];
      }
    });

    bookModelAttrs.forEach(attr => {
      it(`it should render one searched loaned-book by its ${attr} value`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: oneLoanedBook[0][attr]} });
        await loanController.readByAttrs(req, res);

        const { args: [[ template, { loans: rLoans }]] } = res.render;

        const calledWithExpectedArgs = template === 'loan/index' &&
          rLoans.length === 1 &&
          JSON.stringify(oneLoanedBook[0][attr]) === JSON.stringify(rLoans[0]?.Book[attr])

        expect(calledWithExpectedArgs).to.be.true;
      });
    });
  });

  describe('many loaned-book results', async () => {
    const nonUniqueData = { title: 'same-title' };
    let manyLoanedBooks = [];

    before('create loaned-books of identical titles with patrons', async () => {
      await testOps.Data.loadTestDb(null);

      const bookData = testOps.Data.bookData(),
            loanData = testOps.Data.loanData(),
            totalSimilar = 5;

      await testOps.Data.addPatrons(patronService.create, totalSimilar);
      for (let i = 0; i < totalSimilar; i++) {
        const { id: book_id } = await bookService.create({ ...bookData({ set:{...nonUniqueData} }) }),
              { id: loanId } = await loanService.create({ ...(await loanData({ set: {book_id} })) });
        manyLoanedBooks.push( await loanService.readByPk(loanId) );
      }
    });

    bookModelAttrs.forEach((attr, idx) => {
      it(`it should render many searched loans by their ${attr} value`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: nonUniqueData[attr]} });
        await loanController.readByAttrs(req, res);

        const { args: [[ template, { loans: rLoans }]] } = res.render;

        const calledWithExpectedArgs = template === 'loan/index' &&
          rLoans.length === manyLoanedBooks.length &&
          manyLoanedBooks.every((loan, idx) => 
            JSON.stringify(loan) === JSON.stringify(rLoans[idx])
          );

        expect(calledWithExpectedArgs).to.be.true;
      });
    });
  });

  describe('no loaned-book results', async () => {
    const loans = []

    it('it should render no loans', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: null} });
      await loanController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('loan/index', { loans });
    });
  });

  describe('pagination parameters', () => {
    const qplPath = (q, page, limit) => `/loans/search?q=${q}&page=${page}&limit=${limit}`,
          similarLoanedOnDates = new Date();

    const similarTitles = 'similar-title',
          q = similarTitles;

    let allSearchedLoans,
        loan, 
        page, 
        limit, 
        res;

    before('create more instances for pagination', async () => {
      await testOps.Data.loadTestDb(null);
      const loanData = testOps.Data.loanData(),
            total = 20;

      const bookIds = (
        await testOps.Data.addBooks(
          bookService.create, 
          total,
          { set: {title: similarTitles} }
        )
      ).map(({ id }) => id);
      await testOps.Data.addPatrons(patronService.create, total);
      await asyncForEach(bookIds, async book_id => 
        await loanService.create({ ...(await loanData({ set:{book_id} })) })
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
