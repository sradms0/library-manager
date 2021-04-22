'use strict'

/**
 * @module lib/asyncUtil
*/

/**
 * Asynchronous callback for operating on an array element
 * @callback callback
 * @param {object} array[index] - element of array to operate on
 * @param {number} index - location of element in array
 * @param {object} array - array containing elements to operate on
 */

/**
 * Higher order async forEach function 
 * @param {array} array - array of elements to operate from
 * @param {callback} callback - callback function to operate on array elements
*/
exports.asyncForEach = async function(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

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
    return async (...args) => {
      try {
        await cb(...args);
      } catch (error) {
        errorHandler(error);
      }
    }
  }
}
