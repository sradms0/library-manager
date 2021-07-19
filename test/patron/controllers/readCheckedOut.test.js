'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/books');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { patron: patronController } = require('$controllers');

const { 
  book: bookService, 
  loan: loanService,
  patron: patronService 
} = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.patron.readCheckedOut', () => {
  let page, limit, res;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');

    const { Data: {getFutureOrPastDate: fOP} } = testOps,
          today = new Date();

    await testOps.Data.addLoans(
      loanService.create, 
      bookService.create, 
      patronService.create,
      1, { 
        loaned_on: fOP(today, -2),
        return_by: fOP(today, -1)
      }
    );
  });

  beforeEach('', () => {
    res = mockResponse();
  });
  
  it('it should call res.render with patron/index and a limited/offset patrons object with pagination configuration', async () => {
    page = 1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    const { rows: patrons, count } = await patronService.readCheckedOut({ limit, offset: page*limit-limit });
    const totalPages = Math.ceil(count/limit);
    await patronController.readCheckedOut(req, res);

    const [args] = res.render.args,
          [template, { 
            patrons: rPatrons, 
            paginationRoot: rPaginationRoot, 
            page: rPage, 
            limit: rLimit, 
            totalPages: rTotalPages 
          }] = args;

    const calledWithExpectedArgs = template === 'patron/index' &&
      rPage === page && 
      rLimit === limit && 
      rTotalPages === totalPages && 
      rPaginationRoot === '/patrons/checked-out?' &&
      rPatrons.length === patrons.length &&
      patrons.every((patron, idx) => patron.name === rPatrons[idx].name);

    expect(calledWithExpectedArgs).to.be.true;
  });

  it('it should call res.render with patron/index and only an all patrons object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    const { rows: patrons } = await patronService.readCheckedOut();
    await patronController.readCheckedOut(req, res);

    const { args: [[ template, {patrons: rPatrons} ]] } = res.render;

    const calledWithExpectedArgs = template === 'patron/index' &&
      rPatrons.length === patrons.length &&
      patrons.every((patron, idx) => patron.name === rPatrons[idx].name);

    expect(calledWithExpectedArgs).to.be.true;
  });


  it('it should redirect to /patrons/checked-out (with pag/lim querystring) when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/checked-out?page=1&limit=${limit}`);
  });

  it('it should redirect to /patrons/checked-out (with pag/lim querystring) when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/checked-out?page=${-1*page}&limit=${limit}`);
  });

  it('it should redirect to /patrons/checked-out (with pag/lim querystring) when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/checked-out?page=${page}&limit=10`);
  });

  it('it should redirect to /patrons/checked-out (with pag/lim querystring) when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/checked-out?page=${page}&limit=${-1*limit}`);
  });

  it('it should redirect to /patrons/checked-out (with pag/lim querystring) when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/checked-out?page=1&limit=${limit}`);
  });

  it('it should redirect to /patrons/checked-out (with pag/lim querystring) when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/checked-out?page=${page}&limit=10`);
  });

  it('it should redirect to /patrons/checked-out (with pag/lim querystring) when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readCheckedOut(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/checked-out?page=${-1*page}&limit=${-1*limit}`);
  });
});
