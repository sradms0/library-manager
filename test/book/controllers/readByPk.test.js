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


describe('controllers.book.readByPk', () => {
  before('reload', async () => {
    await testOps.Data.loadTestDb('book');
  });
  
  it('it should render book/update and pass one book object', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} }),
          book = await bookService.readByPk(id);

    await bookController.readByPk(req, res);
    expect(res.render).to.have.been.calledWith('book/update', { dataValues: book });
  });

  it('it should throw an error when a non-existent book is requested', async () => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} }),
          book = await bookService.readByPk(id);

    expect(await bookController.readByPk(req, res, err => err.message))
      .to.equal(`Book with id ${id} does not exist`);
  });
});
