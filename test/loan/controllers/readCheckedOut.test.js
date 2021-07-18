'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/loans');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { asyncUtil: {asyncForEach} } = require('$root/lib');

const { loan: loanController } = require('$controllers');

const { 
  book: bookService, 
  loan: loanService,
  patron: patronService 
} = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.book.readCheckedOut', () => {
  let page, limit, res;

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
  });

  beforeEach('', () => {
    res = mockResponse();
  });
  
  it('it should call res.render with loan/index and a limited/offset loans object with pagination configuration', async () => {
    page = 1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    const { rows: loans, count } = await loanService.readCheckedOut({ limit, offset: page*limit-limit });
    const totalPages = Math.ceil(count/limit);
    await loanController.readCheckedOut(req, res);

    const [args] = res.render.args,
          [template, { 
            loans: rLoans, 
            paginationRoot: rPaginationRoot, 
            page: rPage, 
            limit: rLimit, 
            totalPages: rTotalPages 
          }] = args;

    const calledWithExpectedArgs = template === 'loan/index' &&
      rPage === page && 
      rLimit === limit && 
      rTotalPages === totalPages && 
      rPaginationRoot === '/loans/checked-out?' &&
      rLoans.length === loans.length &&
      loans.every((loan, idx) => loan.Book.title === rLoans[idx].Book.title);

    expect(calledWithExpectedArgs).to.be.true;
  });

  it('it should call res.render with loan/index and only a checked-out loans object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    const { rows: loans } = await loanService.readCheckedOut();
    await loanController.readCheckedOut(req, res);

    const { args: [[ template, {loans: rLoans} ]] } = res.render;

    const calledWithExpectedArgs = template === 'loan/index' &&
      rLoans.length === loans.length &&
      loans.every((loan, idx) => loan.Book.title === rLoans[idx].Book.title);

    expect(calledWithExpectedArgs).to.be.true;
  });


  it('it should redirect to /loans/checked-out (with pag/lim querystring) when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans/checked-out?page=1&limit=${limit}`);
  });

  it('it should redirect to /loans/checked-out (with pag/lim querystring) when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans/checked-out?page=${-1*page}&limit=${limit}`);
  });

  it('it should redirect to /loans/checked-out (with pag/lim querystring) when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans/checked-out?page=${page}&limit=10`);
  });

  it('it should redirect to /loans/checked-out (with pag/lim querystring) when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans/checked-out?page=${page}&limit=${-1*limit}`);
  });

  it('it should redirect to /loans/checked-out (with pag/lim querystring) when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans/checked-out?page=1&limit=${limit}`);
  });

  it('it should redirect to /loans/checked-out (with pag/lim querystring) when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans/checked-out?page=${page}&limit=10`);
  });

  it('it should redirect to /loans/checked-out (with pag/lim querystring) when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans/checked-out?page=${-1*page}&limit=${-1*limit}`);
  });
});
