'use strict';

/**
 * Patron routes.
 * @module routes/patron
*/

const express = require('express');
const { patron: patronController } = require('$controllers');

const router = express.Router();


/**
 * A route for viewing all patrons.
 * @name get/all
 * @function
*/
router.get('/all', patronController.readAll);

/**
 * A route for viewing patrons with unreturned loans.
 * @name get/checked-out
 * @function
*/
router.get('/checked-out', patronController.readCheckedOut);

/**
 * A route for patron-deletion confirmation.
 * @name get/:id/delete
 * @function
*/
router.get('/:id/delete', patronController.readDelete);

/**
 * A route for deleting a patron.
 * @name post/:id/delete
 * @function
*/
router.post('/:id/delete', patronController.delete);

/**
 * A route for viewing a patron to update.
 * @name get/:id/update
 * @function
*/
router.get('/:id/update', patronController.readByPk);

/**
 * A route to update a patron.
 * @name post/:id/update
 * @function
*/
router.post('/:id/update', patronController.update);

/**
 * A route for entering properties for a new patron.
 * @name get/new
 * @function
*/
router.get('/new', patronController.readNew);

/**
 * A route to create a patron.
 * @name post/new
 * @function
*/
router.post('/new', patronController.create);

/**
 * A route for viewing patrons with overdue loans.
 * @name get/overdue
 * @function
*/
router.get('/overdue', patronController.readOverdue);

/**
 * A route to view searched patrons.
 * @name get/search
 * @function
*/
router.get('/search', patronController.readByAttrs);

module.exports = router;
