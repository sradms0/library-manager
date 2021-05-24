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
  before('reload', async () => {
    await testOps.loadTestDb();
  });
  
  it('it should render book/index and pass an all books object', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} });
    const { rows: books } = await bookService.readAll();

    await bookController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('book/index', { books });
  });
});
