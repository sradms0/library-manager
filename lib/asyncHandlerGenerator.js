'use strict'

/**
 * Asynchronous function wrapper generator to wait for callback function and catch errors.
 * @param errorHandler - error handling function to be called in asyncHandlers catch block
 * @return { asyncHandler } - the asynchronous function wrapper
*/
exports.asyncHandlerGenerator = function(errorHandler) {
  /**
   * Asynchronous function wrapper to wait for callback function and catch errors.
   * @param cb - the asynchronous function to be called
  */
  return cb => {
    return async () => {
      try {
        await cb();
      } catch (error) {
        errorHandler(error);
      }
    }
  }
}
