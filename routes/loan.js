'use strict';

/**
 * Loan routes.
 * @module routes/loan
*/

const express = require('express');
const { loan: loanController } = require('$controllers');

const router = express.Router();


/**
 * A route for viewing all loans.
 * @name get/all
 * @function
*/
router.get('/all', loanController.readAll);

/**
 * A route for viewing unreturned loans.
 * @name get/checked-out
 * @function
*/
router.get('/checked-out', loanController.readCheckedOut);

/**
 * A route for loan-deletion confirmation.
 * @name get/:id/delete
 * @function
*/
router.get('/:id/delete', loanController.readDelete);

/**
 * A route for deleting a loan.
 * @name post/:id/delete
 * @function
*/
router.post('/:id/delete', loanController.delete);

/**
 * A route for loan-returning confirmation.
 * @name get/:id/return
 * @function
*/
router.get('/:id/return', loanController.readReturn);

/**
 * A route for returning a loan.
 * @name post/:id/return
 * @function
*/
router.post('/:id/return', loanController.return);

/**
 * A route for viewing a loan to update.
 * @name get/:id/update
 * @function
*/
router.get('/:id/update', loanController.readByPk);

/**
 * A route to update a loan.
 * @name post/:id/update
 * @function
*/
router.post('/:id/update', loanController.update);

/**
 * A route for entering properties for a new loan.
 * @name get/new
 * @function
*/
router.get('/new', loanController.readNew);

/**
 * A route to create a loan.
 * @name post/new
 * @function
*/
router.post('/new', loanController.create);

/**
 * A route for viewing overdue loans.
 * @name get/overdue
 * @function
*/
router.get('/overdue', loanController.readOverdue);

/**
 * A route to view searched loans.
 * @name get/overdue
 * @function
*/
router.get('/search', loanController.readByAttrs);

module.exports = router;
