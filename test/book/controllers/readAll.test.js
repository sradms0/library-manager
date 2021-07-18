'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/books');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { book: bookController } = require('$controllers');
const { book: bookService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.book.readAll', () => {
  let page, limit, res;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');
    await testOps.Data.addBooks(bookService.create, 20);
  });

  beforeEach('', () => {
    res = mockResponse();
  });
  
  it('it should call res.render with book/index and a limited/offset books object with pagination configuration', async () => {
    page = 1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    const { rows: books, count } = await bookService.readAll({ limit, offset: page*limit-limit });
    const totalPages = Math.ceil(count/limit);
    await bookController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('book/index', { books, page, limit, totalPages, paginationRoot: '/books/all?' });
  });

  it('it should call res.render with book/index and only an all books object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    const { rows: books } = await bookService.readAll();
    await bookController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('book/index', { books });
  });


  it('it should redirect to /books (with pag/lim querystring) when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/all?page=1&limit=${limit}`);
  });

  it('it should redirect to /books (with pag/lim querystring) when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/all?page=${-1*page}&limit=${limit}`);
  });

  it('it should redirect to /books (with pag/lim querystring) when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/all?page=${page}&limit=10`);
  });

  it('it should redirect to /books (with pag/lim querystring) when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/all?page=${page}&limit=${-1*limit}`);
  });

  it('it should redirect to /books (with pag/lim querystring) when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/all?page=1&limit=${limit}`);
  });

  it('it should redirect to /books (with pag/lim querystring) when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/all?page=${page}&limit=10`);
  });

  it('it should redirect to /books (with pag/lim querystring) when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readAll(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/all?page=${-1*page}&limit=${-1*limit}`);
  });
});
