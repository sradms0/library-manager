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

const fetchBookTrs = browser => browser.querySelectorAll('tbody tr');
const visitRoute = (browser, route) => browser.visit(`http://localhost:3000/${route}`);
const visitBooksRoute = browser => visitRoute(browser, 'books');

describe('views.book.index', () => {
  const browser = new Browser();
  let allBooks;

  before('', async () => {
    chai.request(server);
    allBooks = await bookService.readAll();
    return visitBooksRoute(browser);
  });
  it('it should show all books sorted', () => {
    const titles = allBooks.map(b => b.title).sort(),
          DOMTitles = [...fetchBookTrs(browser)].map(tr => tr.firstChild.textContent);
    const allFound = DOMTitles.length === titles && titles.every((t,i) => t === DOMTitles?.[i]);
    expect(allFound).to.be.true;
  });

  before('', () => {
    chai.request(server);
    allBooks.slice(0,-1).forEach(async b => await b.destroy());
    return visitBooksRoute(browser);
  });
  it('it should show one book when all but one books are removed', async () => {
    const onlyTitle = (await bookService.readAll())?.[0]?.title,
          DOMTitles = [...fetchBookTrs(browser)].map(tr => tr.firstChild.textContent),
          onlyDOMTitle = DOMTitles?.pop();

    const lastFound = !DOMTitles.length && onlyTitle === onlyDOMTitle;
    expect(lastFound).to.true;
  });
  
  before('', async () => {
    chai.request(server);
    await Book.destroy({ where:{}, truncate:true });
    return visitBooksRoute(browser);
  });
  it('it should show no books when all books are removed', async () => {
    const noBooks = await bookService.readAll();
    expect(fetchBookTrs(browser)).to.have.length(0);
  });
});
