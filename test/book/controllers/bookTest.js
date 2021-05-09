'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/books');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { book: bookController } = require('$controllers');
const { book: bookService } = require('$services');
const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

const { stub, match } = require('sinon')
const { mockRequest, mockResponse } = require('mock-req-res')
const proxyquire = require('proxyrequire')

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('controllers.book.create', () => {
  beforeEach('reload', async () => {
    await testOps.loadTestDb();
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
          errors = ['"Author" is required'],
          res = mockResponse(),
          req = mockRequest({ body: book });
    await bookController.create(req, res);
    expect(res.render).to.have.been.calledWith('book/new', { dataValues: {id: null, ...book }, errors });
  });

  it('it should call res.render with prev. data when only an author is given (from validation error)', async () => {
    const book = {title: '', author: 'author'},
          errors = ['"Title" is required'],
          res = mockResponse(),
          req = mockRequest({ body: book });
    await bookController.create(req, res);
    expect(res.render).to.have.been.calledWith('book/new', { dataValues: {id: null, ...book }, errors });
  });

  it('it should call res.render with prev. data when neither title or author are given (from validation error)', async () => {
    const book = {title: '', author: ''},
          errors = ['"Title" is required', '"Author" is required'],
          res = mockResponse(),
          req = mockRequest({ body:  book });
    await bookController.create(req, res);
    expect(res.render).to.have.been.calledWith('book/new', { dataValues: {id: null, ...book }, errors });
  });
});


describe('controllers.book.readAll', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });
  
  it('it should render book/index and pass an all books object', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} }),
          books = await bookService.readAll({ order: [['title', 'ASC']] });

    await bookController.readAll(req, res);
    expect(res.render).to.have.been.calledWith('book/index', { books });
  });
});


describe('controllers.book.readNew', () => {
  it('it should render book/new', async () => {
    const res = mockResponse(),
          req = mockRequest();
    await bookController.readNew(req, res);
    expect(res.render).to.have.been.calledWith('book/new');
  });
});


describe('controllers.book.readByPk', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });
  
  it('it should render book/update and pass one book object', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} }),
          book = await bookService.readByPk(id);

    await bookController.readByPk(req, res);
    expect(res.render).to.have.been.calledWith('book/update', { book });
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


describe('controllers.book.update', () => {
  let updated, id;

  beforeEach('reload', async () => {
    await testOps.loadTestDb();
    id = 1;
    updated =  {
      id: id,
      title: 'updated title', 
      author: 'updated author',
      genre: 'updated genre',
      year: 1,
    }
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

  it('it should redirect the user to /books after a book is updated', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: updated, params: {id} });
    await bookController.update(req, res);
    expect(res.redirect).to.have.been.calledWith('/books');
  })

  it('it should call res.render with prev. data when only a title is given (from validation error)', async () => {
    const updatedCopy = {...updated, title: 'title', author: ''},
          errors = ['"Author" is required'],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });

    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('/book/update', { dataValues: updatedCopy, errors });
  });

  it('it should call res.render with prev. data when only an author is given (from validation error)', async () => {
    const updatedCopy = {...updated, title: '', author: 'author'},
          errors = ['"Title" is required'],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });
    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('/book/update', { dataValues: updatedCopy, errors });
  });

  it('it should call res.render with prev. data when neither title or author are given (from validation error)', async () => {
    const updatedCopy = {...updated, title: '', author: ''},
          errors = ['"Title" is required', '"Author" is required'],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });
    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('/book/update', { dataValues: updatedCopy, errors });
  });
});
