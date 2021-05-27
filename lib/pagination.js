'use strict';

/**
 * @module lib/pagination
*/

/**
 * @typedef {object} req
 * @property {object} req.query - query to access.
 * @property {string} req.query.page - the page (offset) for data-reading.
 * @property {string} req.query.limit - the limit of data.
 */

/**
 * Asserts query parameters, redirecting based on invalid parameters.
 * @param {string} root - the root of the path for redirection.
 * @param {object} res - the resolve object of the route.
 * @param {request} query - query to for data-reading
*/
exports.assertParams = function(root, res, { query: {q, page, limit} }) {
  if (page || limit) {
    const defParams = { page: 1, limit: 10 };
    const fPage = Math.abs(page) || defParams.page,
          fLimit = Math.abs(limit) || defParams.limit;

    if (fPage !== parseInt(page) || fLimit !== parseInt(limit)) {
      const to = `/${root}?${q ? `q=${q}&` : ''}page=${fPage}&limit=${fLimit}`;
      res.redirect(to);
    }
  }
}

/**
 * Reads data and creates a configuration object for rendering read-data based on query parameters.
 * @param {string} dataName - the property name of the data that will be rendered.
 * @param {function} dataHandler - the function to read data
 * @param {request} query - query to for data-reading
 * @return {object} data-rendering configuration
*/
exports.readDataAndCreateRenderConf = async function(dataName, dataHandler, { query: {q=null, page, limit} }) {
  const pageWLimit = page && limit;
  const dataConf = { 
    ...(q && { query: q }), 
    ...(pageWLimit && { limit, offset: page*limit-limit }) 
  };
  const { rows: data, count: totalData } = await dataHandler(dataConf);

  return { 
    [dataName] : data, 
    ...(pageWLimit && { page, limit, totalPages: Math.ceil(totalData/limit) })
  };
}
