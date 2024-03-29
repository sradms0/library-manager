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


describe('controllers.book.update', async () => {
  const { messages: {
    title: titleValMsgs, 
    author: authorValMsgs
  }} = testOps.Data.getModelValidationErrorMessages('book');

  const addLoansPostErrUpdate = (body, Loans) => ({ ...body, Loans });

  let id = 1, Loans, updated;

  beforeEach('', async () => {
    await testOps.Data.loadTestDb();
    ({ Loans } = await bookService.readByPk(id));
    updated =  {
      id: id,
      title: 'updated title', 
      author: 'updated author',
      genre: 'updated genre',
      year: 1,
    };
  });

  it('it should throw an error when a non-existent book update is attempted', async() => {
    const res = mockResponse(),
          badId = -1,
          req = mockRequest({ params: {id: badId} }),
          book = await bookService.readByPk(id);

    expect(await bookController.update(req, res, err => err.message))
      .to.equal(`Book with id ${badId} does not exist`);
  });

  it('it should update one book when all attributes are given', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: updated, params: {id} });
    await bookController.update(req, res);
    const updatedBook = (await bookService.readByPk(id))?.toJSON();
    Object.keys(updated).forEach(key => 
      expect(updated[key]).to.equal(updatedBook[key])
    );
  });

  it('it should redirect the user to /books/all?page=1&limit=10 after a book is updated', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: updated, params: {id} });
    await bookController.update(req, res);
    expect(res.redirect).to.have.been.calledWith('/books/all?page=1&limit=10');
  })

  it('it should call res.render with prev. data when only a title is given (from validation error)', async () => {
    const updatedCopy = {...updated, title: 'title', author: ''},
          errors = [authorValMsgs.notEmpty],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });

    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('book/update', { dataValues: addLoansPostErrUpdate(updatedCopy, Loans), errors });
  });

  it('it should call res.render with prev. data when only an author is given (from validation error)', async () => {
    const updatedCopy = {...updated, title: '', author: 'author'},
          errors = [titleValMsgs.notEmpty],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });
    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('book/update', { dataValues: addLoansPostErrUpdate(updatedCopy, Loans), errors });
  });

  it('it should call res.render with prev. data when neither title or author are given (from validation error)', async () => {
    const updatedCopy = {...updated, title: '', author: ''},
          errors = [authorValMsgs.notEmpty, titleValMsgs.notEmpty],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });
    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('book/update', { dataValues: addLoansPostErrUpdate(updatedCopy, Loans), errors });
  });
});
