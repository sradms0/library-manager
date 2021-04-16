'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { testOperations: testOps } = require('../../lib');
const { expect } = chai;
const server = require('../../../bin/www');

const { book: bookService } = require('../../../services');
const { loader } = require('../../../seed/books');
const { sequelize } = require('../../../database/models');
const { models: {Book} } = sequelize;

const bookData = require('../../data/books.json');
const genreData = require('../../data/genres.json');


chai.use(chaiHttp);

testOps.loadTestDb();

/**
 * Finds all table rows containing book data
 * @param {Browser} browser - zombie instance
 * @returns {NodeList} List of a book table rows 
*/
function fetchBookTrs(browser) {
  return browser.querySelectorAll('tbody tr');
}

/**
 * Navigates to desired route when server is running
 * @param {Browser} browser - zombie instance
 * @param {String} route - route to visit
 * @return {Promise} zombie.Browser.visit
*/
function visitRoute(browser, route) {
  return browser.visit(`http://localhost:3000/${route}`);
}

/**
 * Navigates to /books route
 * @param {Browser} browser - zombie instance
 * @return {Promise} zombie.Browser.visit
*/
function visitBooksRoute(browser){
 return visitRoute(browser, 'books');
}

/**
 * @callback dbOpCb
 */
/**
 * @callback visitCb
 * @param {Browser} browser - zombie instance for visiting
*/

/**
 * Generates function for data operations before a test runs
 * @param {Object} data - container to store return value from dbOpCB
 * @param {dbOpCb} dbOpCb - callback that runs database operations before test
 * @param {Browser} browser - zombie instance for visitCB to run
 * @param {visitCb} visitCb - callback that visits a route
 * @return {function(): void} mocha.before
*/
function genOperateAndVisitRoute(data, dbOpCb, browser, visitCb) {
  return () => before('', async () => {
    chai.request(server);
    const dbOpCbRes = await dbOpCb();
    if (data) data.value = dbOpCbRes;
    return visitCb(browser);
  });
};


describe('views.book.index', () => {
  const browser = new Browser();
  const allBooks = { value: null };

  genOperateAndVisitRoute(
    allBooks, 
    async () => await bookService.readAll(), 
    browser, 
    visitBooksRoute
  )();
  it('it should show all books sorted', () => {
    const titles = allBooks.value.map(b => b.title).sort(),
          DOMTitles = [...fetchBookTrs(browser)].map(tr => tr.firstChild.textContent);
    const allFound = DOMTitles.length === titles && titles.every((t,i) => t === DOMTitles?.[i]);
    expect(allFound).to.be.true;
  });

  genOperateAndVisitRoute(
    null, 
    () => allBooks.value.slice(0,-1).forEach(async b => await b.destroy()),
    browser, 
    visitBooksRoute
  )();
  it('it should show one book when all but one books are removed', async () => {
    const onlyTitle = (await bookService.readAll())?.[0]?.title,
          DOMTitles = [...fetchBookTrs(browser)].map(tr => tr.firstChild.textContent),
          onlyDOMTitle = DOMTitles?.pop();

    const lastFound = !DOMTitles.length && onlyTitle === onlyDOMTitle;
    expect(lastFound).to.true;
  });

  genOperateAndVisitRoute(
    null, 
    async () => await Book.destroy({ where:{}, truncate:true }),
    browser, 
    visitBooksRoute
  )();
  it('it should show no books when all books are removed', async () => {
    const noBooks = await bookService.readAll();
    expect(fetchBookTrs(browser)).to.have.length(0);
  });
});
