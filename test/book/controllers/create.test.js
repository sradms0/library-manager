'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { book: bookController } = require('$controllers');
const { book: bookService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.book.create', () => {
  const { messages: {
    title: titleValMsgs, 
    author: authorValMsgs
  }} = testOps.Data.getModelValidationErrorMessages('book');

  beforeEach('reload', async () => {
    await testOps.loadTestDb('book');
  });

  it('it should create one book when only required attributes are given', async () => {
    const id = 100,
          res = mockResponse(),
          req = mockRequest({ body: {id: 100, title: 'title', author: 'author'} });
    await bookController.create(req, res);
    expect(await bookService.readByPk(id)).to.not.be.null;
  });

  it('it should create one book when all attributes are given', async () => {
    const id = 100,
          res = mockResponse(),
          req = mockRequest({ 
            body: {
              id: 100, 
              title: 'title', 
              author: 'author',
              genre: 'genre',
              year: 1,
            }
          });
    await bookController.create(req, res);
    expect(await bookService.readByPk(id)).to.not.be.null;
  });

  it('it should redirect the user to /books after a book is created', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: {title: 'title', author: 'author'} });
    await bookController.create(req, res);
    expect(res.redirect).to.have.been.calledWith('/books');
  });

  it('it should call res.render with prev. data when only a title is given (from validation error)', async () => {
    const book = {title: 'title', author: ''},
          errors = [authorValMsgs.notEmpty],
          res = mockResponse(),
          req = mockRequest({ body: book });
    await bookController.create(req, res);
    expect(res.render).to.have.been.calledWith('book/new', { dataValues: {id: null, ...book }, errors });
  });

  it('it should call res.render with prev. data when only an author is given (from validation error)', async () => {
    const book = {title: '', author: 'author'},
          errors = [titleValMsgs.notEmpty],
          res = mockResponse(),
          req = mockRequest({ body: book });
    await bookController.create(req, res);
    expect(res.render).to.have.been.calledWith('book/new', { dataValues: {id: null, ...book }, errors });
  });

  it('it should call res.render with prev. data when neither title or author are given (from validation error)', async () => {
    const book = {title: '', author: ''},
          errors = [titleValMsgs.notEmpty, authorValMsgs.notEmpty],
          res = mockResponse(),
          req = mockRequest({ body:  book });
    await bookController.create(req, res);
    expect(res.render).to.have.been.calledWith('book/new', { dataValues: {id: null, ...book }, errors });
  });
});





