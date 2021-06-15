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
  patron: patronService,
} = require('$services');


chai.use(require('chai-http'));


describe('views.loan.update', () => {
  const browser = new Browser();
  let requester;
  let form, id, loan, keys;

  beforeEach('reload', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen(),
    id = 2,
    keys = testOps.Data.getModelAttrs(loanService.model, { without: ['id', 'createdAt', 'updatedAt', 'returned_on']}),
    loan = (await loanService.readByPk(id))?.toJSON(),
    await testOps.Route.visitOneLoan(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display a form for updating a new loan', async () => {
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /loans/:id/update', async () => {
    const [ action ] = form?.action?.match(/\/loans\/\d+\/update$/g);
    expect(action).to.eql(`/loans/${id}/update`);
  });

  it('it should display a button to submit the update-loan form', async () => {
    const submitI = browser.querySelector('form input#update[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /loans', async () => {
    const extractRoute = url => url.match(/\/loans$/g);
    const cancelA = browser.querySelector('a#cancel');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  describe('loan details', () => {
    it('it should show the book assigned to the loan', async () => {
      const { Book: { id } } = loan,
            { value } = browser.querySelector('select[name="book_id"]');
      expect(value).to.equal(id+'');
    });

    it('it should show all books available to the loan', async () => {
      const { count, rows } = await bookService.readAll(),
            { children } = browser.querySelector('select[name="book_id"]');

      const allBooksShowAndMatch = children.length === count && 
        rows.every((book, idx) => book.title === children[idx].textContent);
      expect(allBooksShowAndMatch).to.be.true;
    });
    
    it('it should show the patron assigned to the loan', async () => {
      const { Patron: { id } } = loan,
            { value } = browser.querySelector('select[name="patron_id"]');
      expect(value).to.equal(id+'');
    });

    it('it should show all patrons available to the loan', async () => {
      const { count, rows } = await patronService.readAll(),
            { children } = browser.querySelector('select[name="patron_id"]');

      const allPatronsShowAndMatch = children.length === count && 
        rows.every((patron, idx) => patron.name === children[idx].textContent);
      expect(allPatronsShowAndMatch).to.be.true;
    });
  });
});
