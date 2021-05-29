'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

chai.use(require('chai-http'));


describe('views.error', () => {
  let browser, requester;

  describe('non-existent route', () => {
    browser = new Browser();
    const visitInvalidRoute = async query => {
      try {
        await testOps.Route.visit(browser, 'invalid-route');
      } catch(err) {
        return await browser.querySelector(query);
      }
    }

    before('start server', async () => {
      await testOps.loadTestDb('book');
      requester = await chai.request(server).keepOpen();
    });

    after('stop server', () => {
      requester.close();
    });

    it('it should display a 404 status', async () => {
      await visitInvalidRoute();
      const status = (await visitInvalidRoute('#error-status'))?.textContent;
      expect(status).to.equal('404');
    });

    it('it should display message pertaining to the page not found', async () => {
      const message = (await visitInvalidRoute('#error-message'))?.textContent;
      expect(message).to.equal('Page Not Found');
    });

    it('it should not display the errors callstack', async () => {
      const callStack = (await visitInvalidRoute('#error-stack'));
      expect(callStack).to.be.null;
    });
  });


  describe('non-existent data', () => {
    browser = new Browser();
    const visitInvalidBook = async query => {
      try {
        await testOps.Route.visitOneBook(browser, -1);
      } catch(err) {
        return await browser.querySelector(query);
      }
    }

    before('start server', async () => {
      await testOps.loadTestDb('book');
      requester = await chai.request(server).keepOpen();
    });

    after('stop server', () => {
      requester.close();
    });

    it('it should display a 500 status', async () => {
      const status = (await visitInvalidBook('#error-status'))?.textContent;
      expect(status).to.equal('500');
    });

    it('it should display display a message pertaining to the invalid book error', async () => {
      const message = (await visitInvalidBook('#error-message'))?.textContent;
      expect(message).to.equal(`Book with id -1 does not exist`);
    });

    it('it should display the errors callstack', async () => {
      const callStack = (await visitInvalidBook('#error-stack'))?.textContent;
      expect(callStack).to.include('Error: Book with id -1 does not exist');
    });
  });
});
