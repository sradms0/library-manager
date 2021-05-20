'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');


chai.use(require('chai-http'));


describe('views.book.delete', () => {
  const browser = new Browser();
  let book, form, id, requester;

  beforeEach('', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen(),
    book = (await bookService.readAll())?.[0],
    id = book ? book.id : -1;
    await testOps.Route.visitOneBookDel(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display the title of the book to delete', () => {
    const { textContent } = browser.querySelector('p em#book-title');
    expect(textContent).to.equal(book.title);
  });

  it('it should display a form with a method of of post', () => {
    expect(form?.method).to.equal('post');
  });

  it('it should display a form with an action of /books/:id/delete', () => {
    const [ action ] = form?.action?.match(/\/books\/\d+\/delete$/g);
    expect(action).to.equal(`/books/${id}/delete`);
  });

  it('it should display a button to submit the delete-book form', () => {
    const submitI = form.querySelector('input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /books/:id/update', async () => {
    const extractRoute = url => url?.match(/\/books\/(\d+)\/update$/g);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should submit the form deleting an existing book', async () => {
    form.submit();
    await browser.wait();
    await testOps.Route.visitBooks(browser);
    const noBookA = [...browser.querySelectorAll('td a')].find(a => a.textContent === book.title);
    expect(noBookA).to.be.undefined;
  });
});
