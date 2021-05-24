'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');


chai.use(require('chai-http'));


describe('views.book.index', () => {
  const browser = new Browser();
  let requester;

  beforeEach('reload', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close', () => {
    requester.close();
  })

  it('it should show all books', async () => {
    const { rows: books } = await bookService.readAll();
    await testOps.Route.visitBooks(browser);
    const titles = books.map(b => b.title),
          DOMTitles = [...testOps.fetchBookTrs(browser)].map(tr => tr.firstChild.textContent);
    const allFound = DOMTitles.length === titles.length && titles.every((t,i) => t === DOMTitles?.[i]);
    expect(allFound).to.be.true;
  });

  it('it should show one book when all but one books are removed', async () => {
    const { asyncUtil: {asyncForEach} }  = require('$root/lib');

    const { rows: books } = await bookService.readAll();
    await asyncForEach(books.slice(0,-1), async b => await b.destroy());
    await testOps.Route.visitBooks(browser);

    const { rows: [{ title: onlyTitle }] } = await bookService.readAll(),
          DOMTitles = [...testOps.fetchBookTrs(browser)].map(tr => tr.firstChild.textContent),
          onlyDOMTitle = DOMTitles?.pop();

    const lastFound = !DOMTitles.length && onlyTitle === onlyDOMTitle;
    expect(lastFound).to.true;
  });

  it('it should show no books when all books are removed', async () => {
    await bookService.model.destroy({ truncate: true })
    await testOps.Route.visitBooks(browser);
    const bs = testOps.fetchBookTrs(browser);
    expect(bs).to.have.length(0);
  });

  it('it should direct the user to /books/:id/update when clicking on a book', async () => {
    const extractRoute = url => url?.match(/\/books\/(\d+)\/update$/g);

    await testOps.Route.visitBooks(browser);
    const firstBookA = testOps.fetchBookTrs(browser)?.[0].querySelector('a');
    await browser.clickLink(firstBookA);
    const [ firstBookAHrefRoute ] = extractRoute(firstBookA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(firstBookAHrefRoute);
  });

  it('it should have an anchor element to bring the user to /books/new', async () => {
    const extractRoute = url => url?.match(/\/books\/new$/g);

    await testOps.Route.visitBooks(browser);
    const createBookA = browser.querySelector('p a');
    await browser.clickLink(createBookA);

    const [ createBookAHrefRoute ] = extractRoute(createBookA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(createBookAHrefRoute);
  });
});

