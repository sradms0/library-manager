'use strict';

/**
 * Entry point for accessing asynchronous, error-handling, and pagination tools.
 * @module lib
*/
module.exports = {
  /**
   * Utility for asynchronous error-handling and iteration.
   * @see [lib/asyncUtil]{@link module:lib/asyncUtil}
  */
  asyncUtil: require('./asyncUtil'),
  /**
   * Utility for error-handling meant for controllers.
   * @see [lib/errorHandling]{@link module:lib/errorHandling}
  */
  errorHandling: require('./errorHandling'),
  /**
   * Utility for handling pagination data-reading and query-parameters meant for controllers.
   * @see [lib/pagination]{@link module:lib/pagination}
  */
  pagination: require('./pagination')
};
