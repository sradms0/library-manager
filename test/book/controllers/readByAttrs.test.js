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


describe('controllers.book.readByAttrs', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });

  describe('one book result', async () => {
    let books, title, author, genre, year;

    before('', async () => {
      books = (await bookService.readAll()).rows.slice(0,1);
      if (books.length) {
        books = [ await bookService.update(books[0], {genre: 'very unique'}) ];
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
