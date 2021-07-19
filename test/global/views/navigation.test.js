'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');


chai.use(require('chai-http'));


describe('views.navigation', () => {
  const browser = new Browser();
  let requester;

  const extractAllBooksRoute = url => url?.match(/\/books\/all\?page=1&limit=10/g),
        extractAllPatronsRoute = url => url?.match(/\/patrons\?page=1&limit=10/g),
        extractAllLoansRoute = url => url?.match(/\/loans\/all\?page=1&limit=10/g);

  const routes = [
    '',
    'books/all',
    'books/new',
    'books/1/update',
    'books/1/delete',
    'loans/all',
    'loans/1/update',
    'patrons',
    'patrons/new',
    'patrons/1/update',
    'patrons/1/delete'
  ];
  const pagination = 'page=1&limit=10',
        navData = [{
          name: 'all books',
          extractor: extractAllBooksRoute, 
          href: `/books/all?${pagination}`, 
          id: '#nav-all-books', 
        },{
          name: 'all patrons',
          extractor: extractAllPatronsRoute, 
          href: `/patrons?${pagination}`, 
          id: '#nav-all-patrons'
        }, {
          name: 'all loans',
          extractor: extractAllLoansRoute, 
          href: `/loans/all?${pagination}`, 
          id: '#nav-all-loans'
        }];

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  beforeEach('reload', async () => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitRoot(browser);
  });

  afterEach('close', () => {
    requester.close();
  });

  routes.forEach(route => {
    describe(`/${route} navigation links`, () => {

      navData.forEach(data => {
        const { name, extractor, href, id } = data;

        it(`it should have an ${name} navigation link`, async () => {
          await testOps.Route.visit(browser, route);
          const currA = browser.querySelector(id);

          await browser.clickLink(currA);
          const [ urlRoute ] = extractor(browser.location._url);

          expect(href).to.equal(urlRoute);
        });
      })
    });
  });
});
