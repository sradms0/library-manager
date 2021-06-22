'use strict';

/**
 * @module test/lib/PatronForm
*/

/**
 * Util Class for filling patron-related forms
*/
module.exports = class {
  /**
   * Clears all patron fields.
   * @param {Browser} browser - zombie instance
  */
  static clear(browser) {
    [...browser.querySelectorAll('input.patron-detail')].forEach(input => input.value = '');
  } 

  /**
   * Fills the patron-search field
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill search field
  */
  static fillSearch(browser, val=null) {
    browser.fill('input[name=q]', val);
  } 

  /**
   * Fills the patrons genre field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill genre field (filled if null)
  */
  static fillAddress(browser, val=null) {
    browser.fill('input[name=address]', val ? val : 'new address');
  } 

  /** 
   * Fills the patrons email field
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill email field (filled if null)
  */
  static fillEmail(browser, val=null) {
    browser.fill('input[name=email]', val ? val : 'new_user@mail.com');
  }

  /**
   * Fills the patrons first name field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill first name field (filled if null)
  */
  static fillFirstName(browser, val=null) {
    browser.fill('input[name=first_name]', val ? val : 'newfirst');
  }

  /**
   * Fills the patrons last name field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill last name field (filled if null)
  */
  static fillLastName(browser, val=null) {
    browser.fill('input[name=last_name]', val ? val : 'newlast');
  } 

  /**
   * Fills the patrons library id field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill library id field (filled if null)
  */
  static fillLibraryId(browser, val=null) {
    browser.fill('input[name=library_id]', val ? val : 'newid');
  } 

  /**
   * Fills the patrons zip code field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill zip code field (filled if null)
  */
  static fillZipCode(browser, val=null) {
    browser.fill('input[name=zip_code]', val ? val : '11111');
  } 

  /**
   * Fills all patron form fields
   * @param {Browser} browser - zombie instance
   * @param {object} data - patrons data to fill fields
  */
  static fillAllWith(browser, data) {
    const _data = { ...data };
    delete _data.name;
    Object.keys(_data).forEach(k => browser.fill(`input[name="${k}"]`, _data[k]));
  }
}
