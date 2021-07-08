'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { book: bookService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.book.readByAttrs', async () => {
  const modelAttrs = testOps.Data.getModelAttrs(bookService.model, { without: ['id', 'createdAt', 'updatedAt'] });
  let title;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');
    ({ rows: [{title}] } = await bookService.readAll());
  });

  it('it should return a promise', async () => {
    expect(bookService.readByAttrs(title) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a book total', async () => {
    const { count } = await bookService.readByAttrs({ query: title });
    expect(count).to.equal(1);
  });

  it('it should return a Promise resolving to an object with an array of searched Book instances', async () => {
    const { rows } = await bookService.readByAttrs(title);
    rows.forEach(book => expect(book instanceof bookService.model).to.be.true);
  });

  describe('one book result', async () => {
    const oneAndFound = (searchRes, book) => 
      searchRes?.length === 1 && 
      JSON.stringify(searchRes?.[0]) === JSON.stringify(book);

    let oneBook;
    before('', async () => {
      ({ rows: [oneBook] } = await bookService.readAll());
      if (oneBook)
        oneBook = await bookService.update(oneBook, {genre: 'very unique'});
    });

    modelAttrs.forEach(attr => {
      it(`it should find one book by its ${attr}`, async () => {
        const { rows: searched } = await bookService.readByAttrs({ query: oneBook[attr] }),
              res = oneAndFound(searched, oneBook);
        expect(res).to.be.true;
      });
    })
  });

  describe('many book results', async () => {
    const manyAndFound = (searchRes, books) => 
      searchRes?.length === books.length && searchRes.every((res, idx) => 
        JSON.stringify(res.dataValues) === JSON.stringify(books[idx].dataValues));

    let manyBooks = [];
    const nonUniqueData = {
      title : 'title',
      author : 'author',
      genre : 'genre',
      year : 'year'
    }

    before('create books with identical attrs.', async () => {
      const totalSimilar = 5
      for (let i = 0; i < totalSimilar; i++) {
        // need to fetch after creation since ordering of attrs differ...
        const { id } = await bookService.create(nonUniqueData);
        manyBooks.push( await bookService.model.findByPk(id) );
      }
    });

    modelAttrs.forEach(attr => {
      it(`it should find many books by ${attr}`, async () => {
        const { rows: searched } = await bookService.readByAttrs({ query: nonUniqueData[attr] }),
              res = manyAndFound(searched, manyBooks);
        expect(res).to.be.true;
      });
    })
  });

  describe('no book results', async () => {
    it('it should find no books', async () => {
      const { rows: searched } = await bookService.readByAttrs({ query: null });
      expect(searched).to.be.empty;
    });
  });

  describe('limit and offset', async () => {
    const { Op } = require('sequelize');
    const { model } = bookService,
          modelSearch = query => 
            model.findAndCountAll({ where: {title: { [Op.like]: `%${query}%`}} });

    const similarTitles = 'title';
    let allSearchedBooks, limitedSearchedBooks, 
        offset = 0, limit = 0;

    before('create more instances for pagination', async () => {
      await testOps.Data.addBooks(bookService.create, 20);
      ({ rows: allSearchedBooks } = await modelSearch(similarTitles));
    });

    describe('limit', async () => {
      it('it should return a limit of one searched-book', async () => {
        limit = 1;
        const firstSearchedBook = allSearchedBooks?.slice(offset,limit);
        limitedSearchedBooks = await bookService.readByAttrs({ query: similarTitles, limit, offset });

        const limitCreated = limitedSearchedBooks.rows.length === firstSearchedBook.length &&
          firstSearchedBook[0].title === limitedSearchedBooks.rows[0].title;
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of some searched-books', async () => {
        limit = Math.ceil(allSearchedBooks.length/2);
        const someSearchedBooks = allSearchedBooks?.slice(offset,limit);
        limitedSearchedBooks = await bookService.readByAttrs({ query: similarTitles, limit, offset });

        const limitCreated = limitedSearchedBooks.rows.length === someSearchedBooks.length &&
          someSearchedBooks.every((book, idx) => book.title === limitedSearchedBooks.rows[idx].title);
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of no searched-books', async () => {
        limit = offset = 0;
        let { rows: noSearchedBooks } = await bookService.readByAttrs({ query: similarTitles, limit, offset });
        expect(noSearchedBooks).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one searched-book with an offset greater than zero', async () => {
        offset = limit = 1;
        const secondSearchedBook = allSearchedBooks?.slice(offset,limit+1);
        limitedSearchedBooks = await bookService.readByAttrs({ query: similarTitles, limit, offset });

        const offsetCreated = limitedSearchedBooks.rows.length === secondSearchedBook.length &&
          secondSearchedBook[0].title === limitedSearchedBooks.rows[0].title;
        expect(offsetCreated).to.be.true;
      });

      it('it should return a limit of some searched-books with an offset greater than zero', async () => {
        limit = Math.ceil(allSearchedBooks.length/2);
        const someSearchedBooks = allSearchedBooks?.slice(offset,limit+1);
        limitedSearchedBooks = await bookService.readByAttrs({ query: similarTitles, limit, offset });

        const offsetCreated = limitedSearchedBooks.rows.length === someSearchedBooks.length &&
          someSearchedBooks.every((book, idx) => book.title === limitedSearchedBooks.rows[idx].title);
        expect(offsetCreated).to.be.true;
      });

      it('it should return a limit of no books with an offset equal to the searched-books length', async () => {
        const { count } = await modelSearch(similarTitles);
        limit = 10, offset = count;
        const { rows: noBooks } = await bookService.readByAttrs({ query: similarTitles, limit, offset });
        expect(noBooks).to.be.empty;
      });
    });
  });
});

