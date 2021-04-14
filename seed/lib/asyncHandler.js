'use strict'

const { asyncHandlerGenerator } = require('../../lib/asyncHandlerGenerator');

/**
 * Asynchronous function wrapper for data-seeding
*/
exports.asyncHandler = asyncHandlerGenerator(() => {
    console.error('====ERROR====\n', error); 
    process.exit(1);
});
