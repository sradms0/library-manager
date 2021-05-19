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


describe('controllers.book.readByAttrs', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });

  describe('one book result', async () => {
    let books, title, author, genre, year;

    before('', async () => {
      books = [(await bookService.readAll())?.[0]];
      if (books.length) {
        bookService.update(books[0], {genre: 'very unique'});
        books = [(await bookService.readAll())?.[0]];
        ({ title, author, genre, year } = books?.[0]);
      }
    });

    it('it should render one searched book by its title', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: title} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });

    it('it should render one searched book by its author', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: author} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });

    it('it should render one searched book by its genre', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: genre} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });

    it('it should render one searched book by its year', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: year} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });
  });

  describe('many book results', async () => {
    const title = 'title',
          author = 'author',
          genre = 'genre',
          year = 'year';

    const books = [];

    before('create books with identical attrs.', async () => {
      const totalSimilar = 5
      for (let i = 0; i < totalSimilar; i++) {
        // need to fetch after creation since ordering of attrs differ...
        const { id } = await bookService.create({ title, author, genre, year });
        books.push( await bookService.readByPk(id) );
      }
    });

    it('it should render many books by title', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: title} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });

    it('it should render many books by author', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: author} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });

    it('it should render many books by genre', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: genre} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });

    it('it should render many books by year', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: year} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });
  });

  describe('no book results', async () => {
    const books = []

    it('it should render no books', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: null} });
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books });
    });
  });
});


describe('controllers.book.readDelete', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });
  
  it('it should render book/delete and pass one book object', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} }),
          book = await bookService.readByPk(id);

    await bookController.readDelete(req, res);
    expect(res.render).to.have.been.calledWith('book/delete', { dataValues: book });
  });

  it('it should throw an error when a non-existent book is requested for deletion', async () => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} }),
          book = await bookService.readByPk(id);

    expect(await bookController.readDelete(req, res, err => err.message))
      .to.equal(`Book with id ${id} does not exist`);
  });
});


describe('controllers.book.readNew', () => {
  it('it should render book/new', async () => {
    const res = mockResponse(),
          req = mockRequest();
    await bookController.readNew(req, res);
    expect(res.render).to.have.been.calledWith(
      'book/new', 
      { dataValues: {'id':'', 'title':'', 'author':'', 'genre':'', 'year':'', 'createdAt':'', 'updatedAt':''} }
    );
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
    expect(res.render).to.have.been.calledWith('book/update', { dataValues: updatedCopy, errors });
  });

  it('it should call res.render with prev. data when only an author is given (from validation error)', async () => {
    const updatedCopy = {...updated, title: '', author: 'author'},
          errors = ['"Title" is required'],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });
    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('book/update', { dataValues: updatedCopy, errors });
  });

  it('it should call res.render with prev. data when neither title or author are given (from validation error)', async () => {
    const updatedCopy = {...updated, title: '', author: ''},
          errors = ['"Title" is required', '"Author" is required'],
          res = mockResponse(),
          req = mockRequest({ body: updatedCopy, params: {id} });
    await bookController.update(req, res);
    expect(res.render).to.have.been.calledWith('book/update', { dataValues: updatedCopy, errors });
  });
});


describe('controllers.book.delete', () => {
  let id;

  beforeEach('fetch first available book to delete', async () => {
    await testOps.loadTestDb();
    const book = (await bookService.readAll())?.[0];
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

