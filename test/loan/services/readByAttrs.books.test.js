'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { expect } = chai;

const { asyncUtil: {asyncForEach} } = require('$root/lib');
const { testOperations: testOps } = require('$test/lib');

const { 
  book: bookService,
  loan: loanService, 
  patron: patronService 
} = require('$services');


describe('services.loan.readByAttrs', async () => {
  const bookModelAttrs = testOps.Data.getModelAttrs(bookService.model, { without: [
    'author', 
    'createdAt', 
    'genre', 
    'id', 
    'year', 
    'updatedAt'
  ]})

  let title;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
    ({ rows: [{ Book: { title } }] } = await loanService.readAll());
  });

  it('it should return a promise', async () => {
    expect(loanService.readByAttrs({ query: title }) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a loans total', async () => {
    const { count } = await loanService.readByAttrs({ query: title });
    expect(count).to.equal(1);
  });

  it('it should return a Promise resolving to an object with an array of searched Book instances per loan', async () => {
    const { rows } = await loanService.readByAttrs({ query: title });
    rows.forEach(({ Book: book }) => expect(book instanceof bookService.model).to.be.true);
  });

  describe('one loaned-book result', async () => {
    const oneAndFound = (searchRes, book) => 
      searchRes?.length === 1 && 
      JSON.stringify(searchRes?.[0].Book) === JSON.stringify(book);

    let oneLoanedBook;
    before('make one unique title for a loaned-book', async () => {
      ({ rows: [{ Book: oneLoanedBook }] } = await loanService.readAll());
      if (oneLoanedBook) {
        oneLoanedBook = await bookService.update(oneLoanedBook, { title: 'unique-title' });
      }
    });

    bookModelAttrs.forEach(attr => {
      it(`it should find one loaned-book by ${attr}`, async () => {
        const { rows: searched } = await loanService.readByAttrs({ query: oneLoanedBook[attr] }),
              res = oneAndFound(searched, oneLoanedBook);
        expect(res).to.be.true;
      });
    });
  });

  describe('many loaned-book results', async () => {
    const manyAndFound = (searchRes, books) => 
      searchRes?.length === books.length && searchRes.every((res, idx) => 
        JSON.stringify(res?.Book.dataValues) === JSON.stringify(books[idx]?.dataValues)
      )

    const nonUniqueData = { title: 'same-title' };
    let manyLoanedBooks = [];

    before('create loaned-books of identical titles with patrons', async () => {
      await testOps.Data.loadTestDb(null);

      const bookData = testOps.Data.bookData(),
            loanData = testOps.Data.loanData(),
            totalSimilar = 5;

      await testOps.Data.addPatrons(patronService.create, totalSimilar);
      for (let i = 0; i < totalSimilar; i++) {
        const { id: book_id } = await bookService.create({ ...bookData({ set:{...nonUniqueData} }) }),
              { id: loanId } = await loanService.create({ ...(await loanData({ set: {book_id} })) });
        manyLoanedBooks.push( await bookService.model.findByPk(book_id) );
      }
    });

    bookModelAttrs.forEach((attr, idx) => {
      it(`it should find many loaned-books by ${attr}`, async () => {
        const { rows: searched } = await loanService.readByAttrs({ query: nonUniqueData[attr] }),
              res = manyAndFound(searched, manyLoanedBooks);
        expect(res).to.be.true;
      });
    });
  });

  describe('no loaned-book results', async () => {
    it('it should find no loaned-books', async () => {
      const { rows: searched } = await loanService.readByAttrs({ query: null });
      expect(searched).to.be.empty;
    });
  });

  describe('limit and offset', async () => {
    const { Op } = require('sequelize');
    const { model } = loanService,
          modelSearch = query => 
            model.findAndCountAll({ 
              where: {'$Book.title$': { [Op.like]: `%${query}%`}},
              include: [bookService.model]
            });

    const similarTitles = 'similar-title';
    let allSearchedBookLoans, limitedSearchedBookLoans, 
        offset = 0, limit = 0;
    before('create more instances for pagination', async () => {
      await testOps.Data.loadTestDb(null);
      const loanData = testOps.Data.loanData(),
            total = 20;

      const bookIds = (
        await testOps.Data.addBooks(
          bookService.create, 
          total,
          { set: {title: similarTitles} }
        )
      ).map(({ id }) => id);
      await testOps.Data.addPatrons(patronService.create, total);
      await asyncForEach(bookIds, async book_id => 
        await loanService.create({ ...(await loanData({ set:{book_id} })) })
      );

      ({ rows: allSearchedBookLoans } = await modelSearch(similarTitles));
    });

    describe('limit', async () => {
      it('it should return a limit of one searched loaned-book', async () => {
        limit = 1;
        const firstSearchedBookLoan = allSearchedBookLoans?.slice(offset,limit);
        limitedSearchedBookLoans = await loanService.readByAttrs({ query: similarTitles, limit, offset });

        const limitCreated = limitedSearchedBookLoans.rows.length === firstSearchedBookLoan.length &&
          firstSearchedBookLoan[0].Book.title === limitedSearchedBookLoans.rows?.[0].Book.title;
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of some searched loaned-books', async () => {
        limit = Math.ceil(allSearchedBookLoans.length/2);
        const someSearchedBookLoans = allSearchedBookLoans?.slice(offset,limit);
        limitedSearchedBookLoans = await loanService.readByAttrs({ query: similarTitles, limit, offset });

        const limitCreated = limitedSearchedBookLoans.rows.length === someSearchedBookLoans.length &&
          someSearchedBookLoans.every(({ Book: book }, idx) => book.title === limitedSearchedBookLoans?.rows[idx].Book.title);
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of no searched loaned-books', async () => {
        limit = offset = 0;
        let { rows: noSearchedBookLoans } = await loanService.readByAttrs({ query: similarTitles, limit, offset });
        expect(noSearchedBookLoans).to.be.empty;
      });

      describe('offset', async () => {
        it('it should return a limit of one searched loaned-book with an offset greater than zero', async () => {
          offset = limit = 1;
          const secondSearchedBookLoan = allSearchedBookLoans?.slice(offset,limit+1);
          limitedSearchedBookLoans = await loanService.readByAttrs({ query: similarTitles, limit, offset });

          const offsetCreated = limitedSearchedBookLoans.rows.length === secondSearchedBookLoan.length &&
            secondSearchedBookLoan[0].Book.title === limitedSearchedBookLoans.rows[0].Book.title;
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of some searched loaned-books with an offset greater than zero', async () => {
          limit = Math.ceil(allSearchedBookLoans.length/2);
          const someSearchedBookLoans = allSearchedBookLoans?.slice(offset,limit+1);
          limitedSearchedBookLoans = await loanService.readByAttrs({ query: similarTitles, limit, offset });

          const offsetCreated = limitedSearchedBookLoans.rows.length === someSearchedBookLoans.length &&
            someSearchedBookLoans.every(({ Book: book }, idx) => book.title === limitedSearchedBookLoans.rows[idx].Book.title);
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of no loaned-books with an offset equal to the searched loaned-books length', async () => {
          const { count } = await modelSearch(similarTitles);
          limit = 10, offset = count;
          const { rows: noBooks } = await loanService.readByAttrs({ query: similarTitles, limit, offset });
          expect(noBooks).to.be.empty;
        });
      });
    });
  });
});

