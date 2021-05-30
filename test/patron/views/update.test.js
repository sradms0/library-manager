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
    keys = testOps.Data.getModelAttrs(patronService.model, { without: ['id', 'createdAt', 'updatedAt'] });
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

  it('it should shows details of one patron', async () => {
    const patronDetailIs = browser.querySelectorAll('p input.patron-detail');
    expect(patronDetailIs).to.have.length(6);
    patronDetailIs.forEach((detail, idx) => 
      expect(detail.value).to.eql(patron[ keys[idx] ]+'')
    );
  });
});
