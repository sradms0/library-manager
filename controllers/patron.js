'use strict';

/**
 * Patron controller that uses a Patron service to run CRUD operations 
 * and render data via patron related pug-templates.
 * @module controllers/patron
*/

const { patron: patronService } = require('$services');
const { 
  errorHandling: {assertFind, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');


/**
 * Creates a new patron and redirects to `/patrons/all` with pagination.
 * `RenderOptions` are enabled for errored-data, re-rendering `/views/patron/new`.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/patrons/new', create);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.create = asyncHandler(async function(req, res) {
  const { body } = req;
  await patronService.create(body);
  res.redirect('/patrons/all?page=1&limit=10');
}, { errorView: 'patron/new', model: patronService.model });

/**
 * Deletes a patron and redirects to `/patrons/all` with pagination.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.post('/patrons/:id/delete', delete);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.delete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const patron = await patronService.readByPk(id);
  assertFind(patron, 'Patron', id);
  await patronService.delete(patron);
  res.redirect('/patrons/all?page=1&limit=10');
});

/**
 * Reads all patrons and renders all patrons to '/views/patron/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/all', readAll);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('patrons/all', res, req);
  const renderConf = await readDataAndCreateRenderConf('patrons', patronService.readAll, req, '/patrons/all?');
  res.render('patron/index', renderConf);
});

/**
 * Reads patrons by attribute values based on a query-string and renders matches to '/views/patron/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/search', readByAttrs);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readByAttrs = asyncHandler(async function(req, res) {
  const { query: {q} } = req;
  assertParams('patrons/search', res, req);
  const renderConf = await readDataAndCreateRenderConf('patrons', patronService.readByAttrs, req, `/patrons/search?q=${q}&`);
  res.render('patron/index', renderConf);
});

/**
 * Reads one patron by primary key and renders the patron to '/views/patron/update'.
 * `res.status` is set to `404` if the patron is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/:id/update', readByPk);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readByPk = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const patron = await patronService.readByPk(id);
  assertFind(patron, 'Patron', id);
  res.render('patron/update', { dataValues: patron });
});

/**
 * Reads all patron loanees and renders patrons to '/views/patron/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/checked-out', readCheckedOut);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readCheckedOut = asyncHandler(async function(req, res) {
  assertParams('patrons/checked-out', res, req);
  const renderConf = await readDataAndCreateRenderConf('patrons', patronService.readCheckedOut, req, '/patrons/checked-out?');
  res.render('patron/index', renderConf);
});

/**
 * Reads one patron by primary key and renders the book to '/views/patron/delete' for deletion confirmation.
 * `res.status` is set to `404` if the patron is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/:id/delete', readDelete);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readDelete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const patron = await patronService.readByPk(id);
  assertFind(patron, 'Patron', id);
  res.render('patron/delete', { dataValues: patron });
});

/**
 * Creates a `PatronLiteral` with empty values to render to '/views/patron/new'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/new', readNew);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readNew = function(req, res) {
  const attrs = Object.keys(patronService.model.tableAttributes);
  const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {});
  res.render('patron/new', { dataValues });
};


/**
 * Reads all patrons with overdue patrons and renders patrons to '/views/patron/index'.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/overdue', readOverdue);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.readOverdue = asyncHandler(async function(req, res) {
  assertParams('patrons/overdue', res, req);
  const renderConf = await readDataAndCreateRenderConf('patrons', patronService.readOverdue, req, '/patrons/overdue?');
  res.render('patron/index', renderConf);
});

/**
 * Reads one patron by primary key and renders the patron to '/views/patron/update'.
 * `res.status` is set to `404` if the patron is not found.
 *
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 *
 * @example
 * router.get('/patrons/:id/update', readByPk);
 *
 * @async
 * @function
 * @param {Request}   req - The request object from a route.
 * @param {Response}  res - The resolve object from a route.
*/
exports.update = asyncHandler(async function(req, res) {
  const { id } = req.params, { body } = req;
  const patron = await patronService.readByPk(id);
  assertFind(patron, 'Patron', id);
  await patronService.update(patron, body);
  res.redirect('/patrons/all?page=1&limit=10');
}, { 
  errorView: 'patron/update', 
  model: patronService.model,
  addToBuild: async ({ params: {id} }) => 
    ({ Loans: (await patronService.readByPk(id)).Loans })
});
