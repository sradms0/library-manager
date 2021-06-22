'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { patron: patronService } = require('$services');


chai.use(require('chai-http'));


describe('views.patron.index.pagination', () => {
  const browser = new Browser();
  let requester;
  let page = 1, limit = 10;

  before('reload', async () => {

    await testOps.Data.loadTestDb('patron');
    await testOps.Data.addPatrons(patronService.create, 20);
  });

  beforeEach('start server', async () => {
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close server', () => {
    requester.close();
  });


  it('it should render a limited amount of patrons from pagination parameters', async () => {
    const { rows: pagedPatronData, count: totalPatrons } = await patronService.readAll({ limit, offset: page });
    await testOps.Route.visitPaginatedPatrons(browser, { page, limit });

    const pagedDOMTitles = [...testOps.DOM.fetchTrs(browser)].map(tr => tr.firstChild.textContent),
          pagedDataTitles = pagedPatronData.map(patron => patron.title),
          pagedAndFound = pagedDOMTitles.length === pagedDataTitles.length && pagedDOMTitles.every((t, idx) => t === pagedDOMTitles?.[idx]);

    expect(pagedAndFound).to.be.true;
  });

  it('it should dynamically render pagination links when pagination parameters are given', async () => {
    const { rows: pagedPatronData, count: totalPatrons } = await patronService.readAll({ limit, offset: page });
    await testOps.Route.visitPaginatedPatrons(browser, { page, limit });

    const paginationUl = browser.querySelector('nav.pagination ul');
    expect(paginationUl?.childElementCount).to.equal(Math.ceil(totalPatrons/limit));
  });

  it('it should direct the user to /patrons?page={page+1}&limit={limit} when clicking on a pagination link under non-searced data', async () => {
    const extractRoute = url => url?.match(/\/patrons\?page=\d+&limit=\d+$/g);

    let nextPage = page+1
    const { rows: pagedPatronData, count: totalPatrons } = await patronService.readAll({ limit, offset: page });
    await testOps.Route.visitPaginatedPatrons(browser, { page, limit });

    const nextPaginationLinkA = browser.querySelector(`nav.pagination li:nth-child(${nextPage}) a`);
    await browser.clickLink(nextPaginationLinkA);
    const [ nextPaginationLinkAHrefRoute ] = extractRoute(nextPaginationLinkA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(nextPaginationLinkAHrefRoute);
  });
});
