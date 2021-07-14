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


describe('views.loan.new', () => {
  const _loanData = testOps.Data.loanData(),
        browser = new Browser();

  let requester, form;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book', 'patron');
  });

  beforeEach('start server and navigate to form', async () => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitNewLoan(browser);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display a form for creating a loan', async () => {
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /loans/new', async () => {
    const [ action ] = form?.action?.match(/\/loans\/new$/g);
    expect(action).to.eql(`/loans/new`);
  });

  it('it should display a button to submit the new-loan form', async () => {
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

  it('it should submit the form, creating a new loan', async () => {
    const keys = testOps.Data.getModelAttrs(loanService.model, 
                  { without: ['id', 'createdAt', 'updatedAt', 'returned_on']}
    );
    const loanData = await _loanData({ set: {id:1} });
    const book = await bookService.readByPk(loanData.book_id),
          patron = await patronService.readByPk(loanData.patron_id);

    testOps.LoanForm.fillBook(browser, book.title);
    testOps.LoanForm.fillPatron(browser, patron.name);
    testOps.LoanForm.fillLoanedOn(browser, loanData.loaned_on);
    testOps.LoanForm.fillReturnBy(browser, loanData.return_by);

    form.submit();
    await browser.wait();
    await testOps.Route.visitOneLoan(browser, loanData.id);

    keys.forEach(key => 
      expect(form.querySelector(`#${key}`).value).to.equal(loanData[key]+'')
    )
  });

  describe('new loan details', () => {
    it('it should show the first available book to assign to the new loan', async () => {
      const { id } = await bookService.readByPk(1),
            { value } = browser.querySelector('select[name="book_id"]');
      expect(value).to.equal(id+'');
    });

    it('it should show all books available to the new loan', async () => {
      const { count, rows } = await bookService.readAll(),
            { children } = browser.querySelector('select[name="book_id"]');

      const allBooksShowAndMatch = children.length === count && 
        rows.every((book, idx) => book.title === children[idx].textContent);
      expect(allBooksShowAndMatch).to.be.true;
    });
    
    it('it should show the first available patron to assign to the new loan', async () => {
      const { id } = await patronService.readByPk(1),
            { value } = browser.querySelector('select[name="patron_id"]');
      expect(value).to.equal(id+'');
    });

    it('it should show all patrons available to the new loan', async () => {
      const { count, rows } = await patronService.readAll(),
            { children } = browser.querySelector('select[name="patron_id"]');

      const allPatronsShowAndMatch = children.length === count && 
        rows.every((patron, idx) => patron.name === children[idx].textContent);
      expect(allPatronsShowAndMatch).to.be.true;
    });
  });

  describe('error validation rendering', () => {
    const { Validation: { getValMsgs, withoutVal } } = testOps;
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('loan'); 

    const getExtractErrElementText = browser => [...browser.querySelectorAll('.error')].map(el => el.textContent),
          errorsShow = (DOMErrs, modelErrs) => {
            return errorElementText.length === modelValErrMsgs.length && 
              modelValErrMsgs.every((em, idx) => em === errorElementText[idx]);
          }

    const { Data: { patronData: _patronData, emptyPatron} } = testOps;
    const patronData = _patronData();
    let modelValErrMsgs, errorElementText;

    it('it should not submit the form and show validation errors when only a loaned_on date is given for creating a loan', async () => {
      testOps.LoanForm.clear(browser);
      testOps.LoanForm.fillLoanedOn(browser, new Date()+'');
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron', 'loaned_on', 'returned_on'] }), 
                          { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when an invalid loaned_on date is given for creating a loan', async () => {
      testOps.LoanForm.fillLoanedOn(browser, 'abc');
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron','return_by', 'returned_on'] }), 
                          { sansNestedKeys: ['notNull',  'notEmpty', 'requiredDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only a return_by date is given for creating a loan', async () => {
      testOps.LoanForm.clear(browser);
      testOps.LoanForm.fillReturnBy(browser, new Date()+'');
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron', 'return_by', 'returned_on'] }), 
                          { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when an invalid return_by date is given for creating a loan', async () => {
      testOps.LoanForm.fillReturnBy(browser, 'abc');
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron','loaned_on', 'returned_on'] }), 
                          { sansNestedKeys: ['notNull',  'notEmpty', 'requiredDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when a return_by date before a loaned_on date is given for creating a loan', async () => {
      const today = new Date(browser.querySelector('input[name="loaned_on"]').value)
      const past = testOps.Data.getFutureOrPastDate(today, -1);
      testOps.LoanForm.fillReturnBy(browser, past+'');
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron', 'loaned_on', 'returned_on'] }), 
                          { sansNestedKeys: ['notNull', 'notEmpty', 'isDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when neither a loaned_on and return_by are given for creating a loan', async () => {
      testOps.LoanForm.clear(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['book', 'patron', 'returned_on'] }), 
                          { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });
  });
});
