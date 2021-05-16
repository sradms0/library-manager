'use strict';

/**
 * @module test/lib/testOperations
*/

const { expect } = require('chai');

const { loader } = require('$seed/books');
const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

const bookData = require('$test/data/books.json');
const genreData = require('$test/data/genres.json');

/**
 * Overwrites previous test-database and re-seeds data for testing.
*/
exports.loadTestDb = async function () {
  sequelize.options.logging = false;
  await sequelize.sync({ force:true });
  await loader.load(bookData, genreData, false);
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

}
/**
 * Util Class for filling a book form
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
