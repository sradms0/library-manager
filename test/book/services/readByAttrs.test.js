'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.book.readByAttrs', async () => {
  let title;

  before('reload', async () => {
    await testOps.loadTestDb();
    ({ title } = (await bookService.readAll())?.[0]);
  });

  it('it should return a promise', async () => {
    expect(bookService.readByAttrs(title) instanceof Promise).to.be.true;
  });

  it('it should return a promise resolving to an array of from the search', async () => {
    expect((await bookService.readByAttrs(title)) instanceof Array).to.be.true;
  });

  it('it should return a promise resolving to an array of book instances', async () => {
    const searched = await bookService.readByAttrs(title);
    searched.forEach(book => expect(book instanceof bookService.model).to.be.true);
  });

  describe('one book result', async () => {
    const oneAndFound = (searchRes, book) => 
      searchRes?.length === 1 && 
      JSON.stringify(searchRes?.[0]) === JSON.stringify(book);

    let oneBook, title, author, genre, year;

    before('', async () => {
      oneBook = (await bookService.readAll())?.[0];
      if (oneBook) {
        bookService.update(oneBook, {genre: 'very unique'});
        oneBook = (await bookService.readAll())?.[0];
        ({ title, author, genre, year } = oneBook);
      }
    });

    it('it should find one book by its title', async() => {
      const titleSearched = await bookService.readByAttrs(title),
            res = oneAndFound(titleSearched, oneBook);
      expect(res).to.be.true;
    });

    it('it should find one book by its author', async() => {
      const authorSearched = await bookService.readByAttrs(author),
            res = oneAndFound(authorSearched, oneBook);
      expect(res).to.be.true;
    });

    it('it should find one book by its genre', async() => {
      const genreSearched = await bookService.readByAttrs(genre),
            res = oneAndFound(genreSearched, oneBook);
      expect(res).to.be.true;
    });

    it('it should find one book by its year', async() => {
      const yearSearched = await bookService.readByAttrs(author),
            res = oneAndFound(yearSearched, oneBook);
      expect(res).to.be.true;
    });
  });

  describe('many book results', async () => {
    const manyAndFound = (searchRes, books) => 
      searchRes?.length === books.length && searchRes.every((res, idx) => 
        JSON.stringify(res.dataValues) === JSON.stringify(books[idx].dataValues));

    let manyBooks = [];
    const title = 'title',
          author = 'author',
          genre = 'genre',
          year = 'year';

    before('create books with identical attrs.', async () => {
      const totalSimilar = 5
      for (let i = 0; i < totalSimilar; i++) {
        // need to fetch after creation since ordering of attrs differ...
        const { id } = await bookService.create({ title, author, genre, year });
        manyBooks.push( await bookService.readByPk(id) );
      }
    });

    it('it should find many books by title', async () => {
      const titleSearched = await bookService.readByAttrs(title),
            res = manyAndFound(titleSearched, manyBooks);
      expect(res).to.be.true;
    });

    it('it should find many books by author', async () => {
      const authorSearched = await bookService.readByAttrs(author),
            res = manyAndFound(authorSearched, manyBooks);
      expect(res).to.be.true;
    });

    it('it should find many books by genre', async () => {
      const genreSearched = await bookService.readByAttrs(genre),
            res = manyAndFound(genreSearched, manyBooks);
      expect(res).to.be.true;
    });

    it('it should find many books by year', async () => {
      const yearSearched = await bookService.readByAttrs(year),
            res = manyAndFound(yearSearched, manyBooks);
      expect(res).to.be.true;
    });
  });

  describe('no book results', async () => {
    it('it should find no books', async () => {
      const searched = await bookService.readByAttrs(null);
      expect(searched).to.be.empty;
    });
  });
});

