'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { patron: patronService } = require('$services');


chai.use(require('chai-http'));


describe('views.patron.delete', () => {
  const browser = new Browser();
  let patron, form, id, requester;

  beforeEach('', async () => {
    await testOps.loadTestDb('patron');
    requester = await chai.request(server).keepOpen(),
    ({ rows: [patron] } = await patronService.readAll());
    id = patron ? patron.id : -1;
    await testOps.Route.visitOnePatronDel(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display the name of the patron to delete', () => {
    const { textContent } = browser.querySelector('p em#patron-name');
    expect(textContent).to.equal(`${patron.first_name} ${patron.last_name}`);
  });

  it('it should display a form with a method of of post', () => {
    expect(form?.method).to.equal('post');
  });

  it('it should display a form with an action of /patrons/:id/delete', () => {
    const [ action ] = form?.action?.match(/\/patrons\/\d+\/delete$/g);
    expect(action).to.equal(`/patrons/${id}/delete`);
  });

  it('it should display a button to submit the delete-patron form', () => {
    const submitI = form.querySelector('input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /patrons/:id/update', async () => {
    const extractRoute = url => url?.match(/\/patrons\/(\d+)\/update$/g);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should submit the form deleting an existing patron', async () => {
    form.submit();
    await browser.wait();
    await testOps.Route.visitPatrons(browser);
    const noPatronA = [...browser.querySelectorAll('td a')]
      .find(a => a.textContent === `${patron.first_name} ${patron.last_name}`);
    expect(noPatronA).to.be.undefined;
  });
});
