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

  it('it should throw an error when only a title is given', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: {title: 'title', author: ''} });
    expect(await bookController.create(req, res, err => err.message))
      .to.equal('Validation error: "Author" is required');
  });

  it('it should throw an error when only an author is given', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: {title: '', author: 'author'} });
    expect(await bookController.create(req, res, err => err.message))
      .to.equal('Validation error: "Title" is required');
  });

  it('it should throw an error when neither both title and author aren\'t given', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: {title: '', author: ''} });
    expect(await bookController.create(req, res, err => err.message))
      .to.equal('Validation error: "Title" is required,\nValidation error: "Author" is required');
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

