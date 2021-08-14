'use strict';

/**
 * Utility functions for handling pagination/query-parameters and data-reading for templates.
 * @module lib/pagination
*/

/**
 * Asserts query parameters, redirecting based on invalid parameters.
 *
 * @example
 * <caption>Valid pagination parameters.</caption>
 * const root = '/books/search',
 *       q = '1989',
 *       page = 1,
 *       limit = 10;
 *
 * req.query = { query: {q, page, limit} };
 *
 * // no redirection due to valid parameters
 * assertParams(root, res, req);
 *
 * @example
 * <caption>Invalid pagination parameters.</caption>
 * const root = '/books/search',
 *       q = '1989',
 *       page = 'a',
 *       limit = 'b';
 *
 * req.query = { query: {q, page, limit} };
 *
 * // will redirect to `/books/search/q=1989&page=1&limit=10`
 * assertParams(root, res, req);
 *
 * @see [Request]{@link external:Request}
 * @see [Request.Query]{@link external:Query}
 * @see [Response]{@link external:Response}
 *
 * @param {String}    root            - The root of the path for redirection.
 * @param {Response}  res             - The resolve object of the route.
 * @param {Request}   req             - The resolve object of the route.
 * @param {Query}     req.query       - Query containing parameters to determine data-operations.
 * @param {String}    req.query.q     - What to query.
 * @param {Number}    req.query.page  - The page of where data-operations start in a tables rows.
 * @param {Number}    req.query.limit - How much data to operate on.
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
 *
 * @example
 * try {
 *   const dataName = 'books',
 *         dataHandler = bookService.readAll,
 *         paginationRoot = '/books/all?';
 *
 *   req.query = { page: 1, limit: 10 }
 *
 *   // will contain an object of: { books: [..., ..., ...], paginationRoot, page, limit, totalPages };
 *   const renderConf = await readDataAndCreateRenderConf(dataName, dataHandler, req, paginationRoot);
 *
 *   res.render('book/index', renderConf);
 * } catch(error) {
 *   ...
 *   ...
 *   ...
 * }
 * 
 *
 * @see [Request]{@link external:Request}
 * @see [Request.Query]{@link external:Query}
 * @see [Response]{@link external:Response}
 *
 * @param   {String}      dataName                - The property name of the data that will be rendered.
 * @param   {Function}    dataHandler             - the function to read data.
 * @param   {Query}       req.query               - Query containing parameters to determine data-operations.
 * @param   {String}      [req.query.q=null]      - What to query.
 * @param   {Number}      req.query.page          - The page of where data-operations start in a tables rows.
 * @param   {Number}      req.query.limit         - How much data to operate on.
 * @param   {String}      [paginationRoot=null]   - The root-path for pagination navigation.
 * @return  {Object}                              - Data-rendering configuration.
*/
exports.readDataAndCreateRenderConf = async function(dataName, dataHandler, { query: { q=null, page, limit} }, paginationRoot=null) {
  const pageWLimit = page && limit;
  const dataConf = { 
    ...(q && { query: q }), 
    ...(pageWLimit && { limit: +limit, offset: page*limit-limit }) 
  };
  const { rows: data, count: totalData } = await dataHandler(dataConf);

  return { 
    [dataName] : data, 
    ...(pageWLimit && { paginationRoot, page, limit, totalPages: Math.ceil(totalData/limit) })
  };
}
