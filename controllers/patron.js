'use strict';

/**
 * @module controllers/patron
*/

const { patron: patronService } = require('$services');
const { 
  errorHandling: {assertFind, asyncHandler},
  pagination: {assertParams, readDataAndCreateRenderConf}
} = require('$root/lib');


/**
 * Creates a new patron
*/
exports.create = asyncHandler(async function(req, res) {
  const { body } = req;
  await patronService.create(body);
  res.redirect('/patrons');
}, { errorView: 'patron/new', model: patronService.model });

/**
 * Deletes a patron
*/
exports.delete = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const patron = await patronService.readByPk(id);
  assertFind(patron, 'Patron', id);
  await patronService.delete(patron);
  res.redirect('/patrons');
});

/**
 * Reads all patrons and renders all books to '/views/patron/index'
 *
*/
exports.readAll = asyncHandler(async function(req, res) {
  assertParams('patrons', res, req);
  const renderConf = await readDataAndCreateRenderConf('patrons', patronService.readAll, req, '/patrons?');
  res.render('patron/index', renderConf);
});

/**
 * Reads one patron by primary key and renders patron to '/views/patron/update-patron'.
 * Sets `res.status` to 404 when a patron is not found.
 *
*/
exports.readByPk = asyncHandler(async function(req, res) {
  const { id } = req.params;
  const patron = await patronService.readByPk(id);
  assertFind(patron, 'Patron', id);
  res.render('patron/update', { dataValues: patron });
});

/**
 * Reads a new patron, rendering '/views/patron/new'
*/
exports.readNew = function(req, res) {
  const attrs = Object.keys(patronService.model.tableAttributes);
  const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {});
  res.render('patron/new', { dataValues });
};

/**
 * Updates an existing patron, redirecting to /patrons after.
*/
exports.update = asyncHandler(async function(req, res) {
  const { id } = req.params, { body } = req;
  const patron = await patronService.readByPk(id);
  assertFind(patron, 'Patron', id);
  await patronService.update(patron, body);
  res.redirect('/patrons');
}, { errorView: 'patron/update', model: patronService.model });
