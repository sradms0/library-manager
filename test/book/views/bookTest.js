'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');
const { loader } = require('$seed/books');
const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

const bookData = require('$test/data/books.json');
const genreData = require('$test/data/genres.json');

chai.use(require('chai-as-promised'));
chai.use(require('chai-http'));

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
 * Navigates to /books/:id route
 * @param {Browser} browser - zombie instance
 * @return {Promise} zombie.Browser.visit
*/
function visitOneBookRoute(browser, id){
  return visitRoute(browser, `books/${id}`);
}


describe('views.book.index', () => {
  const browser = new Browser();
  let requester;

  beforeEach('reload', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close', () => {
    requester.close();
  })

  it('it should show all books sorted', async () => {
    const books = await bookService.readAll({ order: [['title', 'ASC']] });
    await visitBooksRoute(browser);
    const titles = books.map(b => b.title),
          DOMTitles = [...fetchBookTrs(browser)].map(tr => tr.firstChild.textContent);
    const allFound = DOMTitles.length === titles.length && titles.every((t,i) => t === DOMTitles?.[i]);
    expect(allFound).to.be.true;
  });

  it('it should show one book when all but one books are removed', async () => {
    const books = await bookService.readAll({ order: [['title', 'ASC']] });
    books.slice(0,-1).forEach(async b => await b.destroy());
    await visitBooksRoute(browser);
    const onlyTitle = (await bookService.readAll())?.[0]?.title,
          DOMTitles = [...fetchBookTrs(browser)].map(tr => tr.firstChild.textContent),
          onlyDOMTitle = DOMTitles?.pop();
    const lastFound = !DOMTitles.length && onlyTitle === onlyDOMTitle;
    expect(lastFound).to.true;
  });

  it('it should show no books when all books are removed', async () => {
    await Book.destroy({ truncate: true })
    await visitBooksRoute(browser);
    const bs = fetchBookTrs(browser);
    expect(bs).to.have.length(0);
  });

  it('it should direct the user to /book/:id when clicking on a book', async () => {
    await visitBooksRoute(browser);
    let id = fetchBookTrs(browser)
              ?.[0].querySelector('a')
              ?.href.split('/').pop();
    id = parseInt(id);

    await expect(browser.clickLink('a')).to.not.be.rejectedWith();
  });
});


describe('views.book.update', () => {
  const browser = new Browser();
  let requester;

  before('reload', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen();
  });

  after('close', () => {
    requester.close();
  });

  it('it should shows details of one book', async () => {
    const id = 1,
          book = (await bookService.readByPk(id))?.toJSON(),
          keys = ['title', 'author', 'genre', 'year'];

    await visitOneBookRoute(browser, id);
    const bookDetailIs = browser.querySelectorAll('p input.book-detail');
    expect(bookDetailIs).to.have.length(4);
    bookDetailIs.forEach((detail, idx) => 
      expect(detail.value).to.eql(book[ keys[idx] ]+'')
    );
  });
});
