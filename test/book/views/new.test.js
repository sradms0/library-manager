'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');

chai.use(require('chai-http'));


describe('views.book.new', () => {
  const browser = new Browser();
  let requester;

  beforeEach('reload', async () => {
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display a form for creating a new book', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /books/new', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    const [ action ] = form?.action?.match(/\/books\/new$/g);
    expect(action).to.eql('/books/new');
  });

  it('it should show fields for creating a new book', async () => {
    await testOps.Route.visitNewBook(browser);
    const bookDetailIs = browser.querySelectorAll('form p input.book-detail'),
          keys = ['title', 'author', 'genre', 'year'];
    const allFieldsMatch = [...bookDetailIs].every((detail, idx) => 
      detail.name === keys[idx]+''
    );
    expect(bookDetailIs.length && allFieldsMatch).to.be.true;
  });

  it('it should display a button to submit the new-book form', async () => {
    await testOps.Route.visitNewBook(browser);
    const submitI = browser.querySelector('form input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should submit the form, creating a new book', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    testOps.BookForm.fillTitle(browser);
    testOps.BookForm.fillAuthor(browser);
    testOps.BookForm.fillGenre(browser);
    testOps.BookForm.fillYear(browser);
    form.submit();
    await browser.wait();
    await testOps.Route.visitBooks(browser);
    const newBookTitle = [...browser.querySelectorAll('td a')]
      .find(a => a.textContent === 'new title')?.textContent;
    expect(newBookTitle).to.eql('new title');
  });

  it('it should have a cancel link that brings the user back to /books', async () => {
    const extractRoute = url => url.match(/\/books$/g);
    await testOps.Route.visitNewBook(browser);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  describe('error validation rendering', () => {
    const getErrorElements = browser => browser.querySelectorAll('.error');
    let form, errorElements;

    beforeEach('', async () => {
      await testOps.Route.visitNewBook(browser);
      form = browser.querySelector('form');
    });

    it('it should not submit the form and show validation errors when only a title is given for creating a new book', async () => {
      testOps.BookForm.fillTitle(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Author" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. title value after validation errors from creating a new book', async () => {
      const titleVal = 'new title';
      testOps.BookForm.fillTitle(browser, titleVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="title"]');
      expect(value).to.equal(titleVal);
    });

    it('it should not submit the form and show validation errors when only an author is given for creating a new book', async () => {
      testOps.BookForm.fillAuthor(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Title" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. author value after validation errors from creating a new book', async () => {
      const authorVal = 'new author';
      testOps.BookForm.fillAuthor(browser, authorVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="author"]');
      expect(value).to.equal(authorVal);
    });

    it('it should not submit the form and show validation errors when neither title nor author is given for creating a new book', async () => {
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const [errEl1, errEl2] = errorElements;
      const errorShows = errorElements.length === 2 && 
        errEl1.textContent === '"Author" is required' && errEl2.textContent === '"Title" is required';
      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. genre value after validation errors from creating a new book', async () => {
      const genreVal = 'new genre';
      testOps.BookForm.fillGenre(browser, genreVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="genre"]');
      expect(value).to.equal(genreVal);
    });

    it('it should not submit the form and display the prev. year value after validation errors from creating a new book', async () => {
      const yearVal = '1';
      testOps.BookForm.fillYear(browser, yearVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="year"]');
      expect(value).to.equal(yearVal);
    });
  });
});

