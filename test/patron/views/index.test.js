'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { patron: patronService } = require('$services');


chai.use(require('chai-http'));


describe('views.patron.index', () => {
  const browser = new Browser();
  let requester;

  beforeEach('reload', async () => {
    await testOps.loadTestDb('patron');
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close', () => {
    requester.close();
  })

  it('it should show all patrons', async () => {
    const { rows: patrons } = await patronService.readAll();
    await testOps.Route.visitPatrons(browser);
    const emails = patrons.map(p => p.email),
          DOMEmails = [...testOps.fetchTrs(browser)].map(tr => tr.childNodes[2].textContent);
    const allFound = DOMEmails.length === emails.length && emails.every((e,i) => e === DOMEmails?.[i]);
    expect(allFound).to.be.true;
  });

  it('it should show one patron when all but one patrons are removed', async () => {
    const { asyncUtil: {asyncForEach} }  = require('$root/lib');

    const { rows: patrons } = await patronService.readAll();
    await asyncForEach(patrons.slice(0,-1), async p => await p.destroy());
    await testOps.Route.visitPatrons(browser);

    const { rows: [{ email: onlyEmail }] } = await patronService.readAll(),
          DOMEmails = [...testOps.fetchTrs(browser)].map(tr => tr.childNodes[2].textContent),
          onlyDOMEmail = DOMEmails?.pop();

    const lastFound = !DOMEmails.length && onlyEmail === onlyDOMEmail;
    expect(lastFound).to.true;
  });

  it('it should direct the user to /patrons/:id/update when clicking on a patron', async () => {
    const extractRoute = url => url?.match(/\/patrons\/(\d+)\/update$/g);

    await testOps.Route.visitPatrons(browser);
    const firstPatronA = testOps.fetchTrs(browser)?.[0].querySelector('a');

    await browser.clickLink(firstPatronA);
    const [ firstPatronAHrefRoute ] = extractRoute(firstPatronA.href),
          [ urlRoute ] = extractRoute(browser.location._url);

    expect(urlRoute).to.equal(firstPatronAHrefRoute);
  });

  it('it should have an anchor element to bring the user to /patrons/new', async () => {
    const extractRoute = url => url?.match(/\/patrons\/new$/g);

    await testOps.Route.visitPatrons(browser);
    const createPatronA = browser.querySelector('p a');
    await browser.clickLink(createPatronA);

    const [ createPatronAHrefRoute ] = extractRoute(createPatronA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(createPatronAHrefRoute);
  });

  it('it should show no patrons when all patrons are removed', async () => {
    await patronService.model.destroy({ truncate: true })
    await testOps.Route.visitPatrons(browser);
    const ps = testOps.fetchTrs(browser);
    expect(ps).to.have.length(0);
  });

});

