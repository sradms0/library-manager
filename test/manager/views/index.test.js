'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');


chai.use(require('chai-http'));


describe('views.manager.index', () => {
  const browser = new Browser();
  let requester;

  before('reload', async () => {
    await testOps.loadTestDb();
  });

  beforeEach('reload', async () => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitRoot(browser);
  });

  afterEach('close', () => {
    requester.close();
  });

  describe('book links', () => {
    it('it should have a link to /books?page=1&limit=10', async () => {
      const extractRoute = url => url?.match(/\/books\?page=1&limit=10/g);
      const allBooksA = browser.querySelector('#all-books'),
            [ allBooksARoute ] = extractRoute(allBooksA.href);

      await browser.clickLink(allBooksA);
      const [ urlRoute ] = extractRoute(browser.location._url);

      expect(allBooksARoute).to.equal(urlRoute);
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
    it('it should have a link to /patrons?page=1&limit=10', async () => {
      const extractRoute = url => url?.match(/\/patrons\?page=1&limit=10/g);
      const allPatronsA = browser.querySelector('#all-patrons'),
            [ allPatronsARoute ] = extractRoute(allPatronsA.href);

      await browser.clickLink(allPatronsA);
      const [ urlRoute ] = extractRoute(browser.location._url);

      expect(allPatronsARoute).to.equal(urlRoute);
    });

    it('it should have a link to /patrons/new', async () => {
      const extractRoute = url => url?.match(/\/patrons\/new/g);
      const newPatronA = browser.querySelector('#new-patron'),
            [ newPatronAHref ] = extractRoute(newPatronA.href);

      await browser.clickLink(newPatronA);
      const [ urlRoute ] = extractRoute(browser.location._url);

      expect(newPatronAHref).to.equal(urlRoute);
    });
  })

});
