'use strict';

/**
 * @module lib/pagination
*/

/**
 * Asserts query parameters, redirecting based on invalid parameters.
 * @param {string} root - the root of the path for redirection.
 * @param {object} res - the resolve object of the route.
 * @param {object} object - contains query params.
 * @param {object} object.query - query object to access.
 * @param {object} object.query.page - the page (offset) for data-reading.
 * @param {object} object.query.limit - the limit of data.
*/
exports.assertParams = function(root, res, { query: {page, limit} }) {
  if (page || limit) {
    const defParams = { page: 1, limit: 10 };
    const fPage = Math.abs(page) || defParams.page,
          fLimit = Math.abs(limit) || defParams.limit;

    if (fPage !== parseInt(page) || fLimit !== parseInt(limit))
      res.redirect(`/${root}?page=${fPage}&limit=${fLimit}`);
  }
}

/**
 * Creates a configuration object for reading data based on parameters.
 * @param {object} object.query - query object to access.
 * @param {object} object.query.page - the page (offset) for data-reading.
 * @param {object} object.query.limit - the limit of data.
 * @return {object} data-reading configuration
*/
exports.createReadConf = function({ query: {page, limit} }) {
  return page && limit ? { limit, offset: page*limit-limit} : {};
}

/**
 * Creates a configuration object for rendering read data based on parameters.
 * @param {string} dataName - the property name of the data that will be rendered.
 * @param {object} data - an array of the data to render.
 * @param {number} totalData - total instances of the model being read from.
 * @param {object} object.query - query object to access.
 * @param {object} object.query.page - the page (offset) for data reading.
 * @param {object} object.query.limit - the limit of data.
 * @return {object} data-rendering configuration
*/
exports.createRenderConf = function(dataName, data, totalData, { query: {page, limit} }) {
  return { 
    [dataName] : data, 
    ...(() => page && limit ? 
      ({ page, limit, totalPages: Math.ceil(totalData/limit) }) : 
      ({}))()
  }
}
