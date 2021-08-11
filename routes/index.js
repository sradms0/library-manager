'use strict';

/**
 * Entry point for accessing all routes.
 * @module routes
*/

module.exports = {
  /** 
   * Book routes.
   * @see module:routes/book 
  */
  book: require('./book'),
  /** 
   * Loan routes.
   * @see module:routes/loan 
  */
  loan: require('./loan'),
  /** 
   * Manager routes.
   * @see module:routes/manager 
  */
  manager: require('./manager'),
  /** 
   * Patron routes.
   * @see module:routes/patron
  */
  patron: require('./patron')
}
