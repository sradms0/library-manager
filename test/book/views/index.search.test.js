'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');


chai.use(require('chai-http'));


describe('views.book.index.search', () => {
  const modelAttrs = testOps.Data.getModelAttrs(bookService.model, { without: ['id', 'createdAt', 'updatedAt'] });
  const browser = new Browser();
  let requester;

  let form, searchI;
  const setSearchElements = () => {
    form = browser.querySelector('form');
    searchI = browser.querySelector('input#book-q');
  } 

  before('reload', async () => {
    await testOps.loadTestDb('book');
  });

  beforeEach('', async() => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitBooks(browser);
    setSearchElements();
  });

  afterEach('close', () => {
    requester.close();
  });

  describe('search-form', () => {
    it('it should have a form for finding books', () => {
      expect(form).to.not.be.null;
    });

    it('it should have a form with get method', () => {
      expect(form?.method).to.equal('get');
    });

    it('it should have a form with an action of /books/search', () => {
      const [ action ] =  form?.action?.match(/\/books\/search$/g);
      expect(action).to.equal('/books/search');
    });

    it('it should have a form with input for book-searching', () => {
      expect(searchI).to.not.be.null;
    });

    it('it should have a search-form with a button for submitting a search', () => {
      const submitI = form?.querySelector('input[type="submit"]');
      expect(submitI).to.not.be.undefined;
    });

    it('it should set a default page and limit after after submitting a search', async () => {
      const { rows: [{ title: firstBookTitle }] }  = await bookService.readAll();
      testOps.BookForm.fillSearch(browser, firstBookTitle);
      form?.submit();
      await browser.wait();
      const [ url ] = browser.location._url.match(/\/books\/search\?q=.+&page=1&limit=10$/g);
      expect(url).to.not.be.null;
    });
  });

  describe('one book result', () => {
    const searchOneAndFound = async (browser, form, attr, tdChildLoc) => {
      testOps.BookForm.fillSearch(browser, attr);
      form?.submit();
      await browser.wait();

      const bookTrs = testOps.fetchTrs(browser);
      const { textContent } = bookTrs[0]?.childNodes[tdChildLoc];

      return bookTrs.length === 1 && textContent === ''+attr;
    }

    let oneBook;
    before('', async () => {
      ({ rows:  [oneBook] } = await bookService.readAll());
      if (oneBook)
        oneBook = await bookService.update(oneBook, { genre: 'very unique' });
    });

    modelAttrs.forEach((attr, idx) => {
      it(`it should show one ${attr}-searched book`, async () => {
        const res = await searchOneAndFound(browser, form, oneBook[attr], idx);
        expect(res).to.be.true;
      });
    });
  });

  describe('many book results', async () => {
    const searchManyAndFound = async (browser, form, attr, books) => {
      testOps.BookForm.fillSearch(browser, attr);
      form?.submit();
      await browser.wait();
      const bookTrs = [...testOps.fetchTrs(browser)],
            bookAttrs = testOps.Data.getModelAttrs(
              bookService.model, 
              { without: ['id', 'createdAt', 'updatedAt'] }
            );

      let attrIdx = -1;
      return bookTrs.length === books.length && bookTrs.every((tr, instIdx) => {
        ++attrIdx < 4 || (attrIdx= 0);
        return tr.childNodes[attrIdx].textContent === ''+books[instIdx][ bookAttrs[attrIdx] ];
      });
    }

    let manyBooks = [];
    const nonUniqueData = {
      title : 'title',
      author : 'author',
      genre : 'genre',
      year : '1000'
    };
    before('create books with identical attrs.', async () => {
      const totalSimilar = 5;
      for (let i = 0; i < totalSimilar; i++) {
        // need to fetch after creation since ordering of attrs differ...
        const { id } = await bookService.create(nonUniqueData);
        manyBooks.push( await bookService.readByPk(id) );
      }
    });

    modelAttrs.forEach(attr => {
      it(`it should show many ${attr}-searched books`, async () => {
        const res = await searchManyAndFound(browser, form, nonUniqueData[attr], manyBooks);
        expect(res).to.be.true;
      });
    });
  });

  describe('no searched-book results', async () => {
    it('it should find no books', async () => {
      testOps.BookForm.fillSearch(browser, 'DOES NOT EXIST');
      form?.submit();
      await browser.wait();

      const bookTrs = testOps.fetchTrs(browser);
      expect(bookTrs).to.be.empty;
    });
  });
});
