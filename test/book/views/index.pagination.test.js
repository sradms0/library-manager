'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');


chai.use(require('chai-http'));


describe('views.book.index.pagination', () => {
  const browser = new Browser();
  let requester;
  let page = 1, limit = 10;

  before('reload', async () => {

    await testOps.loadTestDb('book');
    await testOps.Data.addBooks(bookService.create, 20);
  });

  beforeEach('start server', async () => {
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close server', () => {
    requester.close();
  });


  it('it should render a limited amount of books from pagination parameters', async () => {
    const { rows: pagedBookData, count: totalBooks } = await bookService.readAll({ limit, offset: page });
    await testOps.Route.visitPaginatedBooks(browser, { page, limit });

    const pagedDOMTitles = [...testOps.fetchTrs(browser)].map(tr => tr.firstChild.textContent),
          pagedDataTitles = pagedBookData.map(book => book.title),
          pagedAndFound = pagedDOMTitles.length === pagedDataTitles.length && pagedDOMTitles.every((t, idx) => t === pagedDOMTitles?.[idx]);

    expect(pagedAndFound).to.be.true;
  });

  it('it should dynamically render pagination links when pagination parameters are given', async () => {
    const { rows: pagedBookData, count: totalBooks } = await bookService.readAll({ limit, offset: page });
    await testOps.Route.visitPaginatedBooks(browser, { page, limit });

    const paginationUl = browser.querySelector('nav.pagination ul');
    expect(paginationUl?.childElementCount).to.equal(Math.ceil(totalBooks/limit));
  });

  it('it should direct the user to /books?page={page+1}&limit={limit} when clicking on a pagination link under non-searced data', async () => {
    const extractRoute = url => url?.match(/\/books\?page=\d+&limit=\d+$/g);

    let nextPage = page+1
    const { rows: pagedBookData, count: totalBooks } = await bookService.readAll({ limit, offset: page });
    await testOps.Route.visitPaginatedBooks(browser, { page, limit });

    const nextPaginationLinkA = browser.querySelector(`nav.pagination li:nth-child(${nextPage}) a`);
    await browser.clickLink(nextPaginationLinkA);
    const [ nextPaginationLinkAHrefRoute ] = extractRoute(nextPaginationLinkA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(nextPaginationLinkAHrefRoute);
  });

  it('it should direct the user to /books/search?q=${q}&page={page+1}&limit={limit} when clicking on a pagination link under searced data', async () => {
    const extractRoute = (url, q) => {
      const re = new RegExp(`/books/search\\?q=${q}&page=\\d+&limit=\\d+$`,'g');
      return url?.match(re);
    }

    let query = 'title';
    let nextSearchedPage = page+1
    const { rows: pagedBookData, count: totalBooks } = await bookService.readByAttrs({ query, limit, offset: page });
    await testOps.Route.visitPaginatedBooks(browser, { page, limit, query });

    const nextSearchedPaginationLinkA = browser.querySelector(`nav.pagination li:nth-child(${nextSearchedPage}) a`);
    await browser.clickLink(nextSearchedPaginationLinkA);
    const [ nextSearchedPaginationLinkAHrefRoute ] = extractRoute(nextSearchedPaginationLinkA.href, query),
          [ urlRoute ] = extractRoute(browser.location._url, query);
    expect(urlRoute).to.equal(nextSearchedPaginationLinkAHrefRoute);
  });

  it('it should render no pagination links when pagination parameters aren\'t given', async () => {
    await testOps.Route.visitBooks(browser);
    const paginationNav = browser.querySelector('nav.pagination');
    expect(paginationNav).to.be.null;
  });

});
