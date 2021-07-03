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
    await testOps.Data.loadTestDb(null);
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
          DOMTitles = [...testOps.DOM.fetchTrs(browser)].map(tr => tr.firstChild.textContent);
    const allFound = DOMTitles.length === titles.length && titles.every((t,i) => t === DOMTitles?.[i]);
    expect(allFound).to.be.true;
  });

  it('it should show one loan when all but one loans are removed', async () => {
    const { asyncUtil: {asyncForEach} }  = require('$root/lib');

    const { rows: loans } = await loanService.readAll();
    await asyncForEach(loans.slice(0,-1), async b => await b.destroy());
    await testOps.Route.visitLoans(browser);
    const { rows: [{ Book: {title: onlyTitle} }] } = await loanService.readAll(),
          DOMTitles = [...testOps.DOM.fetchTrs(browser)].map(tr => tr.firstChild.textContent),
          onlyDOMTitle = DOMTitles?.pop();

    const lastFound = !DOMTitles.length && onlyTitle === onlyDOMTitle;
    expect(lastFound).to.true;
  });

  it('it should show no loans when all loans are removed', async () => {
    await loanService.model.destroy({ truncate: true })
    await testOps.Route.visitLoans(browser);
    const ls = testOps.DOM.fetchTrs(browser);
    expect(ls).to.have.length(0);
  });

  it('it should have an anchor element to bring the user to /loans/new', async () => {
    const extractRoute = url => url?.match(/\/loans\/new$/g);

    await testOps.Route.visitLoans(browser);
    const createLoanA = browser.querySelector('p a');
    await browser.clickLink(createLoanA);

    const [ createLoanAHrefRoute ] = extractRoute(createLoanA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(createLoanAHrefRoute);
  });

  describe('table links', () => {

    before('reload', async () => {
      await testOps.Data.loadTestDb();
      const firstOpenLoan = await loanService.model.findOne({where: { returned_on: null }});
      await loanService.update(firstOpenLoan, { returned_on: new Date() });
    });

    beforeEach('revisit /loans', async () => {
      await testOps.Route.visitLoans(browser);
    });

    it('it should direct the user to /books/:id/update when clicking on a book', async () => {
      const extractRoute = url => url?.match(/\/books\/(\d+)\/update$/g);

      await testOps.Route.visitLoans(browser);
      const [firstBookA] = testOps.DOM.fetchTrs(browser)?.[0].querySelectorAll('a');
      await browser.clickLink(firstBookA);
      const [ firstBookAHrefRoute ] = extractRoute(firstBookA.href),
            [ urlRoute ] = extractRoute(browser.location._url);
      expect(urlRoute).to.equal(firstBookAHrefRoute);
    });

    it('it should direct the user to /patrons/:id/update when clicking on a patron', async () => {
      const extractRoute = url => url?.match(/\/patrons\/(\d+)\/update$/g);

      await testOps.Route.visitLoans(browser);
      const [_, firstPatronA] = testOps.DOM.fetchTrs(browser)?.[0].querySelectorAll('a');
      await browser.clickLink(firstPatronA);
      const [ firstPatronAHrefRoute ] = extractRoute(firstPatronA.href),
            [ urlRoute ] = extractRoute(browser.location._url);
      expect(urlRoute).to.equal(firstPatronAHrefRoute);
    });

    it('it should direct the user to /loans/:id/update when clicking on a loans update button', async () => {
      const extractRoute = url => url?.match(/\/loans\/(\d+)\/update$/g);

      const { id: openLoanId } = await loanService.model.findOne({ where: { returned_on: null } }),
            firstLoanUpdateA = browser.querySelectorAll('td.action a.button')?.[0];
      await browser.clickLink(firstLoanUpdateA);
      await testOps.Route.visitOneLoan(browser, openLoanId);

      const [ firstLoanUpdateAHrefRoute ] = extractRoute(firstLoanUpdateA.href),
            [ urlRoute ] = extractRoute(browser.location._url);

      expect(urlRoute).to.equal(firstLoanUpdateAHrefRoute);
    });

    it('it should direct the user to /loans/:id/update when clicking on a loans return button', async () => {
      const extractRoute = url => url?.match(/\/loans\/(\d+)\/return/g);

      const { id: openLoanId } = await loanService.model.findOne({ where: { returned_on: null } }),
            firstLoanReturnA = browser.querySelectorAll('td.action a.button')?.[1];
      await testOps.Route.visitLoanReturn(browser, openLoanId);
      await browser.clickLink(firstLoanReturnA);

      const [ firstLoanReturnAHrefRoute ] = extractRoute(firstLoanReturnA.href),
            [ urlRoute ] = extractRoute(browser.location._url);

      expect(urlRoute).to.equal(firstLoanReturnAHrefRoute);
    });

    const returnedLoans = async bool => (await loanService.readAll()).rows.filter(loan => bool && loan.returned_on),
          mapTitles = loans => loans.map(loan => loan.Book.title),
          loanTrs = (browser, titles) => [...testOps.DOM.fetchTrs(browser)].filter(tr => 
                      titles.indexOf(tr.firstElementChild.textContent) >= 0
                    );
    it('it should not have return or update buttons for closed loans', async () => {
      const closedLoans = await returnedLoans(true),
            closedLoanTrs = loanTrs(browser, mapTitles(closedLoans));
      expect(
        closedLoans.length === closedLoanTrs.length && 
          closedLoanTrs.every(tr => !tr.lastChild?.children.length)
      ).to.be.true;
    });

    it('it should have return and update buttons for open loans', async () => {
      const openLoans = await returnedLoans(false),
            openLoanTrs = loanTrs(browser, mapTitles(openLoans));
      expect(
        openLoans.length === openLoanTrs.length && 
          openLoanTrs.every(tr => tr.lastChild?.children.length === 2)
      ).to.be.true;
    });
  })
});

