'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/loans');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { loan: loanController } = require('$controllers');
const { loan: loanService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.loan.readAll', () => {
  let page, limit, res;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book', 'patron');
    await testOps.Data.addLoans(loanService.create, 20);
  });

  beforeEach('', () => {
    res = mockResponse();
  });
  
  it('it should call res.render with loan/index and a limited/offset loans object with pagination configuration', async () => {
    page = 1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    const { rows: loans, count } = await loanService.readAll({ limit, offset: page*limit-limit });
    const totalPages = Math.ceil(count/limit);
    await loanController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('loan/index', { loans, page, limit, totalPages, paginationRoot: '/loans?' });
  });

  it('it should call res.render with loan/index and only an all loans object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    const { rows: loans } = await loanService.readAll();
    await loanController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('loan/index', { loans });
  });

  it('it should redirect to /loans (with pag/lim querystring) when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans?page=1&limit=${limit}`);
  });

  it('it should redirect to /loans (with pag/lim querystring) when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans?page=${-1*page}&limit=${limit}`);
  });

  it('it should redirect to /loans (with pag/lim querystring) when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans?page=${page}&limit=10`);
  });

  it('it should redirect to /loans (with pag/lim querystring) when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans?page=${page}&limit=${-1*limit}`);
  });

  it('it should redirect to /loans (with pag/lim querystring) when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans?page=1&limit=${limit}`);
  });

  it('it should redirect to /loans (with pag/lim querystring) when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans?page=${page}&limit=10`);
  });

  it('it should redirect to /loans (with pag/lim querystring) when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await loanController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/loans?page=${-1*page}&limit=${-1*limit}`);
  });
});
