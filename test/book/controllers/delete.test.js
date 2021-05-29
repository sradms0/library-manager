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


describe('controllers.book.delete', () => {
  let id;

  beforeEach('fetch first available book to delete', async () => {
    await testOps.loadTestDb('book');
    const { rows: [book] } = (await bookService.readAll());
    id = book ? book.id : -1;
  });

  it('it should throw an error when a non-existent book deletion is attempted', async() => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} });
    expect(await bookController.delete(req, res, err => err.message))
      .to.equal(`Book with id ${id} does not exist`);
  });

  it('it should delete an existing book', async() => {
    const res = mockResponse(),
          req = mockRequest({ params: {id} });
    await bookController.delete(req, res);
    expect(await bookService.readByPk(id)).to.be.null;
  });

  it('it should redirect the user to /books after a book is deleted', async () => {
    const res = mockResponse(),
          req = mockRequest({ params: {id} });
    await bookController.delete(req, res);
    expect(res.redirect).to.have.been.calledWith('/books');
  });
});
