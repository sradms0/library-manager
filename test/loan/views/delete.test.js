'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { loan: loanService } = require('$services');


chai.use(require('chai-http'));


describe('views.loan.delete', () => {
  const browser = new Browser();
  let loan, form, id, requester;

  beforeEach('', async () => {
    await testOps.Data.loadTestDb();
    requester = await chai.request(server).keepOpen(),
    ({ rows: [loan] } = await loanService.readAll());
    id = loan ? loan.id : -1;
    await testOps.Route.visitOneLoanDel(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display the book of the loan to delete', () => {
    const { textContent } = browser.querySelector('p em#book-title');
    expect(textContent).to.equal(`${loan.Book.title}`);
  });

  it('it should display the patron of the loan to delete', () => {
    const { textContent } = browser.querySelector('p em#patron-name');
    expect(textContent).to.equal(`${loan.Patron.name}`);
  });

  it('it should display the loaned-on date of the loan to delete', () => {
    const { textContent } = browser.querySelector('p em#loan-date');
    expect(textContent).to.equal(`${loan.loaned_on+''}`);
  });

  it('it should display the return-by date of the loan to delete', () => {
    const { textContent } = browser.querySelector('p em#return-by-date');
    expect(textContent).to.equal(`${loan.return_by+''}`);
  });

  it('it should display the returned-on date of the loan to delete', () => {
    const { textContent } = browser.querySelector('p em#returned-on-date'),
          date = loan.returned_on ? loan.returned_on+'' : 'N/A';
    expect(textContent).to.equal(date)
  });

  it('it should display a form with a method of of post', () => {
    expect(form?.method).to.equal('post');
  });

  it('it should display a form with an action of /loans/:id/delete', () => {
    const [ action ] = form?.action?.match(/\/loans\/\d+\/delete$/g);
    expect(action).to.equal(`/loans/${id}/delete`);
  });

  it('it should display a button to submit the delete-loan form', () => {
    const submitI = form.querySelector('input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /loans/:id/update', async () => {
    const extractRoute = url => url?.match(/\/loans\/(\d+)\/update$/g);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should submit the form deleting an existing loan', async () => {
    form.submit();
    await browser.wait();
    await testOps.Route.visitLoans(browser);
    const noLoanTr = [...testOps.DOM.fetchTrs(browser)].find(tr => {
      const [ {textContent: bookTitleDOM}, {textContent: patronNameDOM} ] = [...tr.children],
            { Book: { title }, Patron: { name } } = loan;
      return bookTitleDOM === title && patronNameDOM === name;
    });
    expect(noLoanTr).to.be.undefined;
  });
});
