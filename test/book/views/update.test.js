'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');


chai.use(require('chai-http'));


describe('views.book.update', () => {
  const browser = new Browser();
  let requester;
  let form, id, book, keys;

  beforeEach('', async () => {
    await testOps.loadTestDb('book');
    requester = await chai.request(server).keepOpen(),
    id = 1,
    book = (await bookService.readByPk(id))?.toJSON(),
    keys = ['title', 'author', 'genre', 'year'];
    await testOps.Route.visitOneBook(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display a form for updating a new book', async () => {
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /books/:id/update', async () => {
    const [ action ] = form?.action?.match(/\/books\/\d+\/update$/g);
    expect(action).to.eql(`/books/${id}/update`);
  });

  it('it should display a button to submit the update-book form', async () => {
    const submitI = browser.querySelector('form input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /books', async () => {
    const extractRoute = url => url.match(/\/books$/g);
    const cancelA = browser.querySelector('a#cancel');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should have a delete link that brings the user to /books/:id/delete', async () => {
    const extractRoute = url => url.match(/\/books\/\d+\/delete$/g);
    const deleteA = browser.querySelector('a#delete');
    await browser.clickLink(deleteA);

    const [ deleteAHrefRoute ] = extractRoute(deleteA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(deleteAHrefRoute);
  });

  it('it should submit the form, updating the existing book', async () => {
    const updated = { 
      title: 'updated title', 
      author: 'updated author', 
      genre: 'updated genre', 
      year: 1
    };
    Object.keys(updated).forEach(key => 
      browser.fill(`input[name=${key}]`, updated[key])
    );
    form.submit();
    await browser.wait();
    await testOps.Route.visitBooks(browser);
    const updatedBookTds = [...testOps.fetchTrs(browser)]
                            .find(tr => tr.firstChild.textContent === updated.title)?.children;
    const updatedVals = Object.values(updated);

    let found = 0;
    [...updatedBookTds ]?.forEach((td, idx) => {
      found++;
      expect(td.textContent).to.equal(updatedVals[idx]+'')
    });
    expect(found).to.equal(updatedBookTds.length);
  });

  it('it should shows details of one book', async () => {
    const bookDetailIs = browser.querySelectorAll('p input.book-detail');
    expect(bookDetailIs).to.have.length(4);
    bookDetailIs.forEach((detail, idx) => 
      expect(detail.value).to.eql(book[ keys[idx] ]+'')
    );
  });

  describe('error validation rendering', () => {
    const getErrorElements = browser => browser.querySelectorAll('.error');
    let form, errorElements;

    beforeEach('', async () => {
      await testOps.Route.visitOneBook(browser, 1);
      form = browser.querySelector('form');
    });

    it('it should not submit the form and show validation errors when only a title is given for updating a book', async () => {
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillTitle(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Author" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. title value after validation errors from updating a book', async () => {
      const titleVal = 'updated title';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillTitle(browser, titleVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="title"]');
      expect(value).to.equal(titleVal);
    });

    it('it should not submit the form and show validation errors when only an author is given for updating a book', async () => {
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillAuthor(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Title" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. author value after validation errors from updating a book', async () => {
      const authorVal = 'updated author';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillAuthor(browser, authorVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="author"]');
      expect(value).to.equal(authorVal);
    });

    it('it should not submit the form and show validation errors when neither title nor author is given for updating a book', async () => {
      testOps.BookForm.clear(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const [errEl1, errEl2] = errorElements;
      const errorShows = errorElements.length === 2 && 
        errEl1.textContent === '"Author" is required' && errEl2.textContent === '"Title" is required';
      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. genre value after validation errors from updating a book', async () => {
      const genreVal = 'updated genre';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillGenre(browser, genreVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="genre"]');
      expect(value).to.equal(genreVal);
    });

    it('it should not submit the form and display the prev. year value after validation errors from updating a book', async () => {
      const yearVal = '1';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillYear(browser, yearVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="year"]');
      expect(value).to.equal(yearVal);
    });
  });

  it('it should show a form with an action of /book/:id/update after validation errors occur at least once from updating a book', async () => {
      testOps.BookForm.clear(browser)
      form.submit();
      await browser.wait();

      const [ action ] = form?.action?.match(/\/books\/\d+\/update$/g);
      expect(action).to.eql(`/books/${id}/update`);
  });
});
