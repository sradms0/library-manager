'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { patron: patronController } = require('$controllers');
const { patron: patronService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.patron.readAll', () => {
  let page, limit, res;

  before('reload', async () => {
    await testOps.Data.loadTestDb('patron');
    await testOps.Data.addPatrons(patronService.create, 20);
  });

  beforeEach('', () => {
    res = mockResponse();
  });
  
  it('it should call res.render with patron/index and a limited/offset patrons object with pagination configuration', async () => {
    page = 1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    const { rows: patrons, count } = await patronService.readAll({ limit, offset: page*limit-limit });
    const totalPages = Math.ceil(count/limit);
    await patronController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('patron/index', { patrons, page, limit, totalPages, paginationRoot: '/patrons/all?' });
  });

  it('it should call res.render with patron/index and only an all patrons object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    const { rows: patrons } = await patronService.readAll();
    await patronController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('patron/index', { patrons });
  });


  it('it should redirect to /patrons/all (with pag/lim querystring) when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/all?page=1&limit=${limit}`);
  });

  it('it should redirect to /patrons/all (with pag/lim querystring) when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/all?page=${-1*page}&limit=${limit}`);
  });

  it('it should redirect to /patrons/all (with pag/lim querystring) when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/all?page=${page}&limit=10`);
  });

  it('it should redirect to /patrons/all (with pag/lim querystring) when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/all?page=${page}&limit=${-1*limit}`);
  });

  it('it should redirect to /patrons/all (with pag/lim querystring) when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/all?page=1&limit=${limit}`);
  });

  it('it should redirect to /patrons/all (with pag/lim querystring) when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/all?page=${page}&limit=10`);
  });

  it('it should redirect to /patrons/all (with pag/lim querystring) when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await patronController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/patrons/all?page=${-1*page}&limit=${-1*limit}`);
  });
});
