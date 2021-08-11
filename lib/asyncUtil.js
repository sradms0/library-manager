'use strict'

/**
 * Utility functions for asynchronous error-handling and iteration.
 * @module lib/asyncUtil
*/

/**
 * Asynchronous callback for operating on an array element.
 * @callback  arrayCallback
 * @async
 * @param     {Object}  element - The element of array to operate on.
 * @param     {Number}  index   - The location of element in array.
 * @param     {Array}   array   - The array containing elements to operate on.
 */
/**
 * Higher-order asynchronous `forEach` function.
 *
 * @example
 * try {
 *   asyncForEach([..., ..., ...],  async (element) => {
 *    await ...;
 *   })
 * } catch(error) {
 *   ...
 *   ...
 *   ...
 * }
 *
 * @async
 * @param {Array}         array     - The array of elements to operate from.
 * @param {arrayCallback} callback  - The callback function to operate on array elements.
*/
exports.asyncForEach = async function(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Callback for how errors are handled.
 * @callback errorHandlerCallback
 * @async
 * @param {Error} error - The error to handle.
 *
*/
/**
 * Asynchronous function wrapper generator to wait for a callback function and catch errors.
 *
 * @example
 * const asyncHandler = asyncHandlerGenerator(error => {
 *   console.error('====ERROR====\n', error); 
 *   process.exit(1);
 * });
 *
 * @param {errorHandler}- error handling function to be called in asyncHandlers catch block
 * @return {Function} - the asynchronous function wrapper
*/
exports.asyncHandlerGenerator = function(errorHandler) {
  /**
   * Asynchronous function wrapper to wait for callback function and catch errors.
   * @param cb - the asynchronous function to be called
  */
  return cb => {
    return async (...args) => {
      try {
        await cb(...args);
      } catch (error) {
        errorHandler(error);
      }
    }
  }
}
