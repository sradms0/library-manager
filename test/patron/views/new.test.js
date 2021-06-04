'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { patron: patronService } = require('$services');


chai.use(require('chai-http'));


describe('views.patron.new', () => {
  const browser = new Browser();
  let requester;

  before('load patron database', async () => {
    await testOps.loadTestDb('patron');
  })

  beforeEach('start server', async () => {
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close server', () => {
    requester.close();
  });

  it('it should display a form for creating a new patron', async () => {
    await testOps.Route.visitNewPatron(browser);
    const form = browser.querySelector('form');
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    await testOps.Route.visitNewPatron(browser);
    const form = browser.querySelector('form');
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /patrons/new', async () => {
    await testOps.Route.visitNewPatron(browser);
    const form = browser.querySelector('form');
    const [ action ] = form?.action?.match(/\/patrons\/new$/g);
    expect(action).to.eql('/patrons/new');
  });

  it('it should show fields for creating a new patron', async () => {
    await testOps.Route.visitNewPatron(browser);
    const patronDetailIs = browser.querySelectorAll('form p input.patron-detail'),
          keys = testOps.Data.getModelAttrs(patronService.model, { without: ['id','createdAt','updatedAt'] });
    const allFieldsMatch = [...patronDetailIs].every((detail, idx) => 
      detail.name === keys[idx]+''
    );
    expect(patronDetailIs.length && allFieldsMatch).to.be.true;
  });

  it('it should display a button to submit the new-patron form', async () => {
    await testOps.Route.visitNewPatron(browser);
    const submitI = browser.querySelector('form input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should submit the form, creating a new patron', async () => {
    await testOps.Route.visitNewPatron(browser);
    const form = browser.querySelector('form');
    testOps.PatronForm.fillFirstName(browser);
    testOps.PatronForm.fillLastName(browser);
    testOps.PatronForm.fillEmail(browser);
    testOps.PatronForm.fillAddress(browser);
    testOps.PatronForm.fillZipCode(browser);
    testOps.PatronForm.fillLibraryId(browser);
    form.submit();
    await browser.wait();
    await testOps.Route.visitPatrons(browser);
    const newPatronTitle = [...browser.querySelectorAll('td a')]
      .find(a => a.textContent === 'newfirst newlast')?.textContent;
    expect(newPatronTitle).to.eql('newfirst newlast');
  });

  it('it should have a cancel link that brings the user back to /patrons', async () => {
    const extractRoute = url => url.match(/\/patrons$/g);
    await testOps.Route.visitNewPatron(browser);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  describe('error validation rendering', () => {
    const { Validation: { getValMsgs, withoutVal } } = testOps;
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('patron'); 

    const getExtractErrElementText = browser => 
            [...browser.querySelectorAll('.error')].map(el => el.textContent),
          errorsShow = (DOMErrs, modelErrs) => 
            errorElementText.length === modelValErrMsgs.length && modelValErrMsgs.every((em, idx) => em === errorElementText[idx]);

    const patronData = testOps.Data.patronData();
    let form, modelValErrMsgs, errorElementText;

    beforeEach('', async () => {
      await testOps.Route.visitNewPatron(browser);
      form = browser.querySelector('form');
    });


    it('it should not submit the form and show validation errors when only a first name is given for creating a new patron', async () => {
      testOps.PatronForm.fillFirstName(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['first_name'] }), { sansNestedKeys: ['notNull', 'unique']});
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only a last name is given for creating a new patron', async () => {
      testOps.PatronForm.fillLastName(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['last_name'] }), { sansNestedKeys: ['notNull', 'unique'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only an email is given for creating a new patron', async () => {
      testOps.PatronForm.fillEmail(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['email'] }), { sansNestedKeys: ['notNull', 'unique'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only an address is given for creating a new patron', async () => {
      testOps.PatronForm.fillAddress(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['address'] }), { sansNestedKeys: ['notNull', 'unique'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only a zip code is given for creating a new patron', async () => {
      testOps.PatronForm.fillZipCode(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['zip_code'] }), { sansNestedKeys: ['notNull', 'unique'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only a library id is given for creating a new patron', async () => {
      testOps.PatronForm.fillLibraryId(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['library_id'] }), { sansNestedKeys: ['notNull', 'unique'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when all  form fields are empty for creating a new patron', async () => {
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(valMsgs, { sansNestedKeys: ['notNull', 'unique'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when a duplicate email is given for creating a new patron', async () => {
      const patron = patronData();
      await patronService.create(patron);
      patron.library_id = 'unique_id';

      testOps.PatronForm.fillAllWith(browser, patron);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['library_id'] }), { sansNestedKeys: ['notNull', 'notEmpty', 'is'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when a duplicate library_id is given for creating a new patron', async () => {
      const patron = patronData();
      await patronService.create(patron);
      patron.email = 'unique_email@mail.com';

      testOps.PatronForm.fillAllWith(browser, patron);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['email'] }), { sansNestedKeys: ['notNull', 'notEmpty', 'is'] });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and display the prev. first name value after validation errors from creating a new patron', async () => {
      const firstNameVal = 'prevfirst';
      testOps.PatronForm.fillFirstName(browser, firstNameVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="first_name"]');
      expect(value).to.equal(firstNameVal);
    });

    it('it should not submit the form and display the prev. last name value after validation errors from creating a new patron', async () => {
      const lastNameVal = 'prevlast';
      testOps.PatronForm.fillLastName(browser, lastNameVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="last_name"]');
      expect(value).to.equal(lastNameVal);
    });

    it('it should not submit the form and display the prev. email value after validation errors from creating a new patron', async () => {
      const emailVal = 'prev_user@mail.com';
      testOps.PatronForm.fillEmail(browser, emailVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="email"]');
      expect(value).to.equal(emailVal);
    });

    it('it should not submit the form and display the prev. address value after validation errors from creating a new patron', async () => {
      const addressVal = 'prevaddr';
      testOps.PatronForm.fillAddress(browser, addressVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="address"]');
      expect(value).to.equal(addressVal);
    });

    it('it should not submit the form and display the prev. zip value after validation errors from creating a new patron', async () => {
      const zipVal = '11111';
      testOps.PatronForm.fillZipCode(browser, zipVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="zip_code"]');
      expect(value).to.equal(zipVal);
    });

    it('it should not submit the form and display the prev. library id value after validation errors from creating a new patron', async () => {
      const libraryIdVal = 'prevlib111';
      testOps.PatronForm.fillLibraryId(browser, libraryIdVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="library_id"]');
      expect(value).to.equal(libraryIdVal);
    });
  });
});

