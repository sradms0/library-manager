'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { patron: patronService } = require('$services');


chai.use(require('chai-http'));


describe('views.patron.update', () => {
  const browser = new Browser(),
        patronData = testOps.Data.patronData();
  let requester;
  let form, id, patron, keys;

  before('reload', async () => {
    await testOps.loadTestDb('patron');
  });

  beforeEach('', async () => {
    requester = await chai.request(server).keepOpen(),
    id = 1,
    patron = (await patronService.readByPk(id))?.toJSON(),
    keys = testOps.Data.getModelAttrs(patronService.model, { without: ['id', 'createdAt', 'updatedAt', 'name'] });
    await testOps.Route.visitOnePatron(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display a form for updating a new patron', async () => {
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /patrons/:id/update', async () => {
    const [ action ] = form?.action?.match(/\/patrons\/\d+\/update$/g);
    expect(action).to.eql(`/patrons/${id}/update`);
  });

  it('it should display a button to submit the update-patron form', async () => {
    const submitI = browser.querySelector('form input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /patrons', async () => {
    const extractRoute = url => url.match(/\/patrons$/g);
    const cancelA = browser.querySelector('a#cancel');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should have a delete link that brings the user to /patrons/:id/delete', async () => {
    const extractRoute = url => url.match(/\/patrons\/\d+\/delete$/g);
    const deleteA = browser.querySelector('a#delete');
    await browser.clickLink(deleteA);

    const [ deleteAHrefRoute ] = extractRoute(deleteA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(deleteAHrefRoute);
  });

  it('it should submit the form, updating the existing book', async () => {
    const updated = testOps.Data.patronData()();
    testOps.PatronForm.fillAllWith(browser, updated);
    form.submit();
    await browser.wait();
    await testOps.Route.visitPatrons(browser);
    const updatedPatronTds = [...testOps.fetchTrs(browser)]
                            .find(tr => tr.firstChild.textContent === (updated.first_name+' '+updated.last_name))?.children;

    const [first_name, last_name,...updatedVals] = Object.values(updated);
    // order of table values differ; these should be changed at some point anyway
    [updatedVals[1], updatedVals[2]] = [updatedVals[2], updatedVals[1]];
    [updatedVals[3], updatedVals[4]] = [updatedVals[4], updatedVals[3]];
    let found = 0;
    [...updatedPatronTds ]?.forEach((td, idx) => {
      found++;
      expect(td.textContent).to.equal(updatedVals[idx]+'')
    });
    expect(found).to.equal(updatedPatronTds.length);
  });

  it('it should shows details of one patron', async () => {
    const patronDetailIs = browser.querySelectorAll('p input.patron-detail');
    expect(patronDetailIs).to.have.length(6);
    patronDetailIs.forEach((detail, idx) => 
      expect(detail.value).to.eql(patron[ keys[idx] ]+'')
    );
  });

  describe('error validation rendering', () => {
    const { Validation: { getValMsgs, withoutVal } } = testOps;
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('patron'); 

    const getExtractErrElementText = browser => 
            [...browser.querySelectorAll('.error')].map(el => el.textContent),
          errorsShow = (DOMErrs, modelErrs) => 
            errorElementText.length === modelValErrMsgs.length && modelValErrMsgs.every((em, idx) => em === errorElementText[idx]);

    const { Data: { patronData: _patronData, emptyPatron} } = testOps;
    const patronData = _patronData();
    let form, modelValErrMsgs, errorElementText;

    beforeEach('', async () => {
      await testOps.Route.visitOnePatron(browser, id);
      form = browser.querySelector('form');
    });

    it('it should not submit the form and show validation errors when only a first_name is given for updating a patron', async () => {
      testOps.PatronForm.clear(browser);
      testOps.PatronForm.fillFirstName(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['first_name'] }), 
                          { sansNestedKeys: ['notNull', 'unique'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only a last_name is given for updating a patron', async () => {
      testOps.PatronForm.clear(browser);
      testOps.PatronForm.fillLastName(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['last_name'] }), 
                          { sansNestedKeys: ['notNull', 'unique'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only an email is given for updating a patron', async () => {
      testOps.PatronForm.clear(browser);
      testOps.PatronForm.fillEmail(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['email'] }), 
                          { sansNestedKeys: ['notNull', 'unique'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only an address is given for updating a patron', async () => {
      testOps.PatronForm.clear(browser);
      testOps.PatronForm.fillAddress(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['address'] }), 
                          { sansNestedKeys: ['notNull', 'unique'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only an zip_code is given for updating a patron', async () => {
      testOps.PatronForm.clear(browser);
      testOps.PatronForm.fillZipCode(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['zip_code'] }), 
                          { sansNestedKeys: ['notNull', 'unique'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when only an library_id is given for updating a patron', async () => {
      testOps.PatronForm.clear(browser);
      testOps.PatronForm.fillLibraryId(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['library_id'] }), 
                          { sansNestedKeys: ['notNull', 'unique'], sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when all form fields are empty for updating a patron', async () => {
      testOps.PatronForm.clear(browser);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(valMsgs, { sansNestedKeys: ['notNull', 'unique'] , sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when a duplicate email is given for updating a patron', async () => {
      const [{email}, {email: dupEmail}]  = testOps.Data.patron;
      testOps.PatronForm.fillEmail(browser, dupEmail);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['library_id'] }), 
                          { sansNestedKeys: ['notNull', 'notEmpty', 'is'] , sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });

    it('it should not submit the form and show validation errors when a duplicate library_id is given for updating a patron', async () => {
      const [{library_id}, {library_id: dupLibId}]  = testOps.Data.patron;
      testOps.PatronForm.fillLibraryId(browser, dupLibId);
      form.submit();
      await browser.wait();

      errorElementText = getExtractErrElementText(browser);
      modelValErrMsgs = getValMsgs(withoutVal(valMsgs, { props: ['email'] }), 
                          { sansNestedKeys: ['notNull', 'notEmpty', 'is'] , sorted: true });
      expect(errorsShow(errorElementText, modelValErrMsgs)).to.be.true;
    });
  });
});
