'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');


chai.use(require('chai-http'));


describe('views.manager.index', () => {
  const browser = new Browser(),
        dataFilters = ['all', 'checked-out', 'overdue'];

  let requester;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  beforeEach('reload', async () => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitRoot(browser);
  });

  afterEach('close', () => {
    requester.close();
  });

  describe('book links', () => {
    describe('filters', () => {
      dataFilters.forEach(filter => {
        it(`it should have a link to /books/${filter}?page=1&limit=10`, async () => {
          const routeRe = new RegExp(`/books/${filter}\\?page=1&limit=10`, 'g'),
                extractRoute = url => url?.match(routeRe);

          const filterBooksA = browser.querySelector(`#${filter}-books`),
                [ filterBooksARoute ] = extractRoute(filterBooksA.href);

          await browser.clickLink(filterBooksA);
          const [ urlRoute ] = extractRoute(browser.location._url);

          expect(filterBooksARoute).to.equal(urlRoute);
        });
      });
    });

    it('it should have a link to /books/new', async () => {
      const extractRoute = url => url?.match(/\/books\/new/g);
      const newBookA = browser.querySelector('#new-book'),
            [ newBookAHref ] = extractRoute(newBookA.href);

      await browser.clickLink(newBookA);
      const [ urlRoute ] = extractRoute(browser.location._url);

      expect(newBookAHref).to.equal(urlRoute);
    });
  })

  describe('patron links', () => {
    describe('filters', () => {
      dataFilters.forEach(filter => {
        it(`it should have a link to /patrons/${filter}?page=1&limit=10`, async () => {
          const routeRe = new RegExp(`/patrons/${filter}\\?page=1&limit=10`, 'g'),
                extractRoute = url => url?.match(routeRe);

          const filterPatronsA = browser.querySelector(`#${filter}-patrons`),
                [ filterPatronsARoute ] = extractRoute(filterPatronsA.href);

          await browser.clickLink(filterPatronsA);
          const [ urlRoute ] = extractRoute(browser.location._url);

          expect(filterPatronsARoute).to.equal(urlRoute);
        });
      });

      it('it should have a link to /patrons/new', async () => {
        const extractRoute = url => url?.match(/\/patrons\/new/g);
        const newPatronA = browser.querySelector('#new-patron'),
              [ newPatronAHref ] = extractRoute(newPatronA.href);

        await browser.clickLink(newPatronA);
        const [ urlRoute ] = extractRoute(browser.location._url);

        expect(newPatronAHref).to.equal(urlRoute);
      });
    });
  });

  describe('loan links', () => {
    describe('filters', () => {
      dataFilters.forEach(filter => {
        it(`it should have a link to /loans/${filter}?page=1&limit=10`, async () => {
          const routeRe = new RegExp(`/loans/${filter}\\?page=1&limit=10`, 'g'),
                extractRoute = url => url?.match(routeRe);

          const filterLoansA = browser.querySelector(`#${filter}-loans`),
                [ filterLoansARoute ] = extractRoute(filterLoansA.href);

          await browser.clickLink(filterLoansA);
          const [ urlRoute ] = extractRoute(browser.location._url);

          expect(filterLoansARoute).to.equal(urlRoute);
        });
      });
    });

    it('it should have a link to /loans/new', async () => {
      const extractRoute = url => url?.match(/\/loans\/new/g);
      const newLoanA = browser.querySelector('#new-loan'),
            [ newLoanAHref ] = extractRoute(newLoanA.href);

      await browser.clickLink(newLoanA);
      const [ urlRoute ] = extractRoute(browser.location._url);

      expect(newLoanAHref).to.equal(urlRoute);
    });
  });

});
