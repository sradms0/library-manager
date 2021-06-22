'use strict';

/**
 * @module test/lib/DOM
*/

/**
 * Util Class for anything DOM related
 */
module.exports = class {
  /**
   * Finds all table rows containing data
   * @param {Browser} browser - zombie instance
   * @returns {NodeList} List of a book table rows 
  */
  static fetchTrs(browser) {
    return browser.querySelectorAll('tbody tr');
  }

}
