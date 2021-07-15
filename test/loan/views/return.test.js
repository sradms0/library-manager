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


describe('views.loan.return', () => {
  const browser = new Browser();
  let form, loan, requester;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  beforeEach('start server', async () => {
    await testOps.Data.loadTestDb();
    requester = await chai.request(server).keepOpen();
    const { id: _ } = await loanService.model.findOne({ where: {returned_on: null} });
    loan = await loanService.readByPk(_);
    await testOps.Route.visitLoanReturn(browser, loan.id);
    form = browser.querySelector('form');
  });

  afterEach('close server', () => {
    requester.close();
  });

  it('it should display a form for returning a loan', async () => {
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /loans/:id/return', async () => {
    const [ action ] = form?.action?.match(/\/loans\/\d+\/return$/g);
    expect(action).to.eql(`/loans/${loan.id}/return`);
  });

  it('it should display a button to submit the return-loan form', async () => {
    const submitI = browser.querySelector('form input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /loans?page=1&limit=10', async () => {
    const extractRoute = url => url.match(/\/loans\?page=1&limit=10$/g);
    const cancelA = browser.querySelector('a#cancel');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should submit the form, returning the loan', async () => {
    form.submit();
    await browser.wait();
    expect((await loanService.readByPk(loan.id)).returned_on).to.not.be.null;
  });

  describe('loan details', () => {
    it('it should show the book assigned to the loan', async () => {
      const { textContent } = browser.querySelector('#book')?.lastChild;
      expect(textContent).to.equal(loan.Book.title);
    });

    it('it should show the patron assigned to the loan', async () => {
      const { textContent } = browser.querySelector('#patron')?.lastChild;
      expect(textContent).to.equal(loan.Patron.name);
    });

    it('it should show when the loan was created', async () => {
      const { textContent } = browser.querySelector('#loaned_on')?.lastChild;
      expect(new Date(textContent).toDateString()).to.equal(loan.loaned_on.toDateString());
    });

    it('it should show input prefilled with todays date', async () => {
      const { value } = browser.querySelector('input[name="returned_on"]');
      expect(new Date(value).toDateString()).to.equal(new Date(value).toDateString());
    });
  });

  describe('error validation rendering', () => {
    const { Validation: { getValMsgs, withoutVal } } = testOps;
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('loan'); 

    const getExtractErrElementText = browser => [...browser.querySelectorAll('.error')].map(el => el.textContent),
          errorsShow = (DOMErrs, modelErrs) => {
            return errorElementText.length === modelErrs.length && 
              modelErrs.every((em, idx) => em === errorElementText[idx]);
          }

    let errorElementText, modelValErrMsgs;

    it('it should not submit the form and show validation errors when an invalid return_by date is given for returning a loan', async () => {
      testOps.LoanForm.fillReturnedOn(browser, 'abc');
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron','loaned_on', 'return_by'] }), 
                          { sansNestedKeys: ['notNull',  'notEmpty', 'requiredDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when a returned_on date before a loaned_on date is given for returning a loan', async () => {
      const past = testOps.Data.getFutureOrPastDate(loan.loaned_on, -1);
      testOps.LoanForm.fillReturnedOn(browser, past+'');
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron', 'loaned_on', 'return_by'] }), 
                          { sansNestedKeys: ['notNull', 'notEmpty', 'isDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });
  });
});
