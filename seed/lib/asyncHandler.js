'use strict'

/**
 * Asynchronous function wrapper to wait for callback function and catch errors.
 * This is meant for data-seeding.
 * @param cb - the asynchronous function to be called
*/
exports.asyncHandler = function(cb) {
  return async () => {
    try {
      await cb();
    } catch (error) {
      console.error('====ERROR====\n', error); 
      process.exit(1);
    }
  }
}
