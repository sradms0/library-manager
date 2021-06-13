'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { 
  book: bookService, 
  loan: loanService, 
  patron: patronService 
} = require('$services');


chai.use(require('chai-http'));


describe('views.loan.index', () => {
  const browser = new Browser();
  let requester;

  before('reload', async () => {
    await testOps.loadTestDb(null);
    await testOps.Data.addLoans(
      loanService.create, 
      bookService.create, 
      patronService.create, 
      20
    );
  });

  beforeEach('reload', async () => {
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close', () => {
    requester.close();
  })

  it('it should show all loans', async () => {
    const { rows: loans } = await loanService.readAll();
    await testOps.Route.visitLoans(browser);
    const titles = loans.map(loan => loan?.Book.title),
          DOMTitles = [...testOps.fetchTrs(browser)].map(tr => tr.firstChild.textContent);
    const allFound = DOMTitles.length === titles.length && titles.every((t,i) => t === DOMTitles?.[i]);
    expect(allFound).to.be.true;
  });

  it('it should show one loan when all but one loans are removed', async () => {
    const { asyncUtil: {asyncForEach} }  = require('$root/lib');

    const { rows: loans } = await loanService.readAll();
    await asyncForEach(loans.slice(0,-1), async b => await b.destroy());
    await testOps.Route.visitLoans(browser);
    const { rows: [{ Book: {title: onlyTitle} }] } = await loanService.readAll(),
          DOMTitles = [...testOps.fetchTrs(browser)].map(tr => tr.firstChild.textContent),
          onlyDOMTitle = DOMTitles?.pop();

    const lastFound = !DOMTitles.length && onlyTitle === onlyDOMTitle;
    expect(lastFound).to.true;
  });

  it('it should show no loans when all loans are removed', async () => {
    await loanService.model.destroy({ truncate: true })
    await testOps.Route.visitLoans(browser);
    const ls = testOps.fetchTrs(browser);
    expect(ls).to.have.length(0);
  });
});

