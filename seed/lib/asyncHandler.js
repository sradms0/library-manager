'use strict'

/**
 * @module seed/lib/asyncHandler
*/

const { asyncUtil: {asyncHandlerGenerator} } = require('$root/lib');

/**
 * Asynchronous function wrapper for data-seeding
*/
exports.asyncHandler = asyncHandlerGenerator(error => {
    console.error('====ERROR====\n', error); 
    process.exit(1);
});

