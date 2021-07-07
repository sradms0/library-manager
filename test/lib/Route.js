'use strict';

/**
 * @module test/lib/Route
*/

/**
 * Util Class for route navigation
*/
module.exports = class {
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
   * Navigates to / route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitRoot(browser) {
   return this.visit(browser, '');
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
   * Navigates to /loans route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitLoans(browser) {
   return this.visit(browser, 'loans');
  }

  /**
   * Navigates to /patrons route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitPatrons(browser) {
    return this.visit(browser, 'patrons');
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
   * Navigates to /loans route containing pagination parameters
   * @param {Browser} browser - zombie instance
   * @param {object} params - contains query parameters to paginate from
   * @return {Promise} zombie.Browser.visit
  */
  static visitPaginatedLoans(browser, { page, limit, query=null }) {
    return this.visit(browser, `loans${query ? `/search?q=${query}&` : '?'}page=${page}&limit=${limit}`);
  }

  /**
   * Navigates to /patrons route containing pagination parameters
   * @param {Browser} browser - zombie instance
   * @param {object} params - contains query parameters to paginate from
   * @return {Promise} zombie.Browser.visit
  */
  static visitPaginatedPatrons(browser, { page, limit, query=null }) {
    return this.visit(browser, `patrons${query ? `/search?q=${query}&` : '?'}page=${page}&limit=${limit}`);
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
   * Navigates to /loans/new route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitNewLoan(browser) {
    return this.visit(browser, 'loans/new');
  }

  /**
   * Navigates to /patrons/new route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitNewPatron(browser) {
    return this.visit(browser, 'patrons/new');
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
   * Navigates to /loans/:id route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOneLoan(browser, id) {
    return this.visit(browser, `loans/${id}/update`);
  }

  /**
   * Navigates to /loans/:id/return route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitLoanReturn(browser, id) {
    return this.visit(browser, `loans/${id}/return`);
  }

  /**
   * Navigates to /patrons/:id route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOnePatron(browser, id) {
    return this.visit(browser, `patrons/${id}/update`);
  }

  /**
   * Navigates to /books/:id/delete route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOneBookDel(browser, id) {
    return this.visit(browser, `books/${id}/delete`);
  }

  /**
   * Navigates to /loans/:id/delete route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOneLoanDel(browser, id) {
    return this.visit(browser, `loans/${id}/delete`);
  }

  /**
   * Navigates to /patrons/:id/delete route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOnePatronDel(browser, id) {
    return this.visit(browser, `patrons/${id}/delete`);
  }

}
