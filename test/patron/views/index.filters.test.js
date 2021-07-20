'use strict';

process.env.NODE_ENV = 'test';

const { asyncUtil: {asyncForEach} } = require('$root/lib');
const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');


chai.use(require('chai-http'));


describe('views.book.index', () => {
  const browser = new Browser(),
        filters = ['all', 'checked-out', 'overdue'],
        pagination = '\\?page=1&limit=10';

  let requester;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  beforeEach('start server', async () => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitPatrons(browser);
  });

  afterEach('close server', () => {
    requester.close();
  });

  
  for(let i = 0; i < filters.length; i++) {
    const filter = filters[i];
    it(`it should show a(n) ${filter}-patrons filter link`, async () => {
      const extractRoute = url => url?.match(new RegExp(`/patrons/${filter}${pagination}$`, 'g')),
            filterA = browser.querySelector(`#filter-${filter}`),
            [ filterAHref ] = extractRoute(filterA?.href);

      await browser.clickLink(filterA);
      const [route] = extractRoute(browser.location._url);
      expect(filterAHref).to.equal(route);
    });
  }
});
