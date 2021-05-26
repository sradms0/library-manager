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
    let page, limit;

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

  describe('pagination parameters', () => {
    const similarTitles = 'title',
          q = similarTitles;

    let page, limit, res;

    before('', async () => {
      await testOps.Data.addBooks(bookService.create, 20);
    });


    beforeEach('', () => {
      res = mockResponse();
    });

    it('it should call res.render with book/index and a limited/offset books object with pagination configuration', async () => {
      page = 1, limit = 10;
      const req = mockRequest({ query: {q, page, limit} });
      const { rows: books, count } = await bookService.readByAttrs(q, { limit, offset: page*limit-limit });
      const totalPages = Math.ceil(count/limit);
      await bookController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('book/index', { books, page, limit, totalPages });
    });

  it('it should call res.render with book/index and only an all books object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {q, page, limit} });
    const { rows: books } = await bookService.readByAttrs(q);
    await bookController.readByAttrs(req, res);
    expect(res.render).to.have.been.calledWith('book/index', { books });
  });

    it('it should redirect to /books/search?q={q}&page={page}&limit={limit} when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await bookController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/search?q=${q}&page=1&limit=${limit}`);
  });

  it('it should redirect to /books/search?q={q}&page={page}&limit={limit} when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await bookController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/search?q${q}&page=${-1*page}&limit=${limit}`);
  });

  it('it should redirect to /books/search?q={q}&page={page}&limit={limit} when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {q, page, limit} });
    await bookController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/search?q=${q}&page=${page}&limit=10`);
  });

  it('it should redirect to /books/search?q={q}&page={page}&limit={limit} when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {q, page, limit} });
    await bookController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/search?q=${q}&page=${page}&limit=${-1*limit}`);
  });

  it('it should redirect to /books/search?q={q}&page={page}&limit={limit} when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await bookController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/search?${q}&page=1&limit=${limit}`);
  });

  it('it should redirect to /books/search?q={q}&page={page}&limit={limit} when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {q, page, limit} });
    await bookController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/search?q=${q}&page=${page}&limit=10`);
  });

  it('it should redirect to /books/search?q={q}&page={page}&limit={limit} when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {page, limit} });
    await bookController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(`/books/search?q=${q}&page=${-1*page}&limit=${-1*limit}`);
  });
  })
});
