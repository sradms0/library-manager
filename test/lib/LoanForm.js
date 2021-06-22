'use strict';

/**
 * @module test/lib/LoanForm
*/

/**
 * Util Class for filling loan-related forms
*/
module.exports= class {
  /**
   * Clears all loan fields.
   * @param {Browser} browser - zombie instance
  */
  static clear(browser) {
    [...browser.querySelectorAll('input.loan-detail')].forEach(input => input.value = '');
  } 

  /**
   * Fills the loans book field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill book field
  */
  static fillBook(browser, val) {
    browser.select('select#book_id', val);
  } 

  /**
   * Fills the loans patron field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill patron field
  */
  static fillPatron(browser, val) {
    browser.select('select#patron_id', val);
  } 

  /**
   * Fills the loans loaned on field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill loaned_on field (filled if null)
  */
  static fillLoanedOn(browser, val=null) {
    browser.fill('input[name=loaned_on]', val ? val : new Date());
  } 

  /**
   * Fills the loans return by field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill loan_on field (filled if null)
  */
  static fillReturnBy(browser, val=null) {
    browser.fill('input[name=return_by]', val ? val : require('./Data').getFutureOrPastDate(new Date(), 7));
  } 
}

