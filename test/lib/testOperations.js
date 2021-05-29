'use strict';

/**
 * @module test/lib/testOperations
*/

const { loader: bookLoader } = require('$seed/books');
const { loader: patronLoader } = require('$seed/patrons');
const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;


/**
 * Overwrites previous test-database and re-seeds data for testing.
*/
exports.loadTestDb = async function (loader) {
  sequelize.options.logging = false;
  await sequelize.sync({ force:true });

  const loaders = {
    'book':     async () => await bookLoader.load(exports.Data.book, exports.Data.genre, false),
    'patron':   async () => await patronLoader.load(exports.Data.patron, exports.Data.libraryId, false)
  };

  await loaders[loader]();
}

/**
 * Finds all table rows containing book data
 * @param {Browser} browser - zombie instance
 * @returns {NodeList} List of a book table rows 
*/
exports.fetchBookTrs = function(browser) {
  return browser.querySelectorAll('tbody tr');
}

/**
 * Util Class for anything data/model related
 */
exports.Data = class Data {

  /** raw book-data */
  static book = require('$test/data/books.json');

  /** raw patron-data */
  static patron = require('$test/data/patrons.json');

  /** raw genre-data */
  static genre = require('$test/data/genres.json');

  /** raw library-id-data */
  static libraryId = require('$test/data/libraryIds.json');

  /** 
   * Find attribute keys of a model.
   * @param {object} model - model to grab attribute keys from
   * @returns {object} array of attribute keys
  */
  static getModelAttrs(model, setFilter=null) {
    let keys = Object.keys(model.tableAttributes);
    return (setFilter ? keys.filter(key => setFilter.has(key)) : keys);
  }

  /** 
   * Add books to the current testing database.
   * @param {function} creator - the function to add book data with
   * @param {number} total - the amount of books to add
  */
  static async addBooks(creator, total) {
    for (let i = 0; i < total; i++) {
      await creator({ 
        title: `title ${i}`,
        author: `author ${i}`,
        genre: `genre ${i}`,
        year: i
      });
    }
  }
}

/**
 * Util Class for route navigation
*/
exports.Route = class Route {
  /**
   * Navigates to desired route when server is running
   * @param {Browser} browser - zombie instance
   * @param {String} route - route to visit
   * @return {Promise} zombie.Browser.visit
  */
  static visit(browser, route) {
    return browser.visit(`http://localhost:3000/${route}`);
  }

  /**
   * Navigates to /books route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitBooks(browser) {
   return this.visit(browser, 'books');
  }

  /**
   * Navigates to /books route containing pagination parameters
   * @param {Browser} browser - zombie instance
   * @param {object} params - contains query parameters to paginate from
   * @return {Promise} zombie.Browser.visit
  */
  static visitPaginatedBooks(browser, { page, limit, query=null }) {
    return this.visit(browser, `books${query ? `/search?q=${query}&` : '?'}page=${page}&limit=${limit}`);
  }

  /**
   * Navigates to /books/new route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitNewBook(browser) {
    return this.visit(browser, 'books/new');
  }

  /**
   * Navigates to /books/:id route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOneBook(browser, id) {
    return this.visit(browser, `books/${id}/update`);
  }

  /**
   * Navigates to /books/:id/delete route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOneBookDel(browser, id) {
    return this.visit(browser, `books/${id}/delete`);
  }

}
/**
 * Util Class for filling a book-related forms
*/
exports.BookForm = class BookForm {
  /**
   * Clears all books fields.
   * @param {Browser} browser - zombie instance
  */
  static clear(browser) {
    [...browser.querySelectorAll('input.book-detail')].forEach(input => input.value = '');
  } 

  /**
   * Fills the book-search field
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill search field
  */
  static fillSearch(browser, val=null) {
    browser.fill('input[name=q]', val);
  } 

  /**
   * Fills the books title field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill title field (filled if null)
  */
  static fillTitle(browser, val=null) {
    browser.fill('input[name=title]', val ? val : 'new title');
  }

  /**
   * Fills the books author field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill author field (filled if null)
  */
  static fillAuthor(browser, val=null) {
    browser.fill('input[name=author]', val ? val : 'new author');
  } 

  /**
   * Fills the books genre field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill genre field (filled if null)
  */
  static fillGenre(browser, val=null) {
    browser.fill('input[name=genre]', val ? val : 'new genre');
  } 

  /**
   * Fills the books year field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill year field (filled if null)
  */
  static fillYear(browser, val=null) {
    browser.fill('input[name=year]', val ? val : val ? val : '1');
  } 
}
