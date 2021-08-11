'use strict';

/**
 * Book routes.
 * @module routes/book
*/

const express = require('express');
const { book: bookController } = require('$controllers');

const router = express.Router();


/**
 * A route for viewing all books.
 * @name get/all
 * @function
*/
router.get('/all', bookController.readAll);

/**
 * A route for viewing checked-out books.
 * @name get/checked-out
 * @function
*/
router.get('/checked-out', bookController.readCheckedOut);

/**
 * A route for book-deletion confirmation.
 * @name get/:id/delete
 * @function
*/
router.get('/:id/delete', bookController.readDelete);

/**
 * A route for deleting a book.
 * @name post/:id/delete
 * @function
*/
router.post('/:id/delete', bookController.delete);

/**
 * A route for viewing a book to update.
 * @name get/:id/update
 * @function
*/
router.get('/:id/update', bookController.readByPk);

/**
 * A route to update a book.
 * @name post/:id/update
 * @function
*/
router.post('/:id/update', bookController.update);

/**
 * A route for entering properties for a new book.
 * @name get/new
 * @function
*/
router.get('/new', bookController.readNew);

/**
 * A route to create a book.
 * @name post/new
 * @function
*/
router.post('/new', bookController.create);

/**
 * A route for viewing overdue books.
 * @name get/overdue
 * @function
*/
router.get('/overdue', bookController.readOverdue);

/**
 * A route to view searched books.
 * @name get/search
 * @function
*/
router.get('/search', bookController.readByAttrs);

module.exports = router;
