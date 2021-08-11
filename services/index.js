'use strict';

/**
 * Entry point for accessing database service-modules.
 * @module services
*/
module.exports = {
  /** 
   * Book service.
   * @see module:services/book 
  */
  book: require('./book'),

  /** 
   * Loan service.
   * @see module:services/loan 
  */
  loan: require('./loan'),

  /** 
   * Patron service.
   * @see module:services/patron 
  */
  patron: require('./patron')
};
