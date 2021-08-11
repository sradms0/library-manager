'use strict';

/**
 * Entry point for accessing routing controller-modules.
 * @module controllers
*/
module.exports = {
  /** 
   * Book controller.
   * @see module:controllers/book 
  */
  book: require('./book'),
  /** 
   * Loan controller.
   * @see module:controllers/loan 
  */
  loan: require('./loan'),
  /** 
   * Manager controller.
   * @see module:controllers/manager
  */
  manager: require('./manager'),
  /** 
   * Patron controller.
   * @see module:controllers/patron 
  */
  patron: require('./patron'),
  /** 
   * Error controller.
   * @see module:controllers/error 
  */
  error: require('./error')
};
