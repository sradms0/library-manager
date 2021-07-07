'use strict';

const express = require('express');
const { loan: loanController } = require('$controllers');

const router = express.Router();


/* GET loans listing. */
router.get('/', loanController.readAll);

/* GET one loan for deletion. */
router.get('/:id/delete', loanController.readDelete);

/* POST loan for deletion. */
router.post('/:id/delete', loanController.delete);

/* GET one loan. */
router.get('/:id/update', loanController.readByPk);

/* POST update existing loan. */
router.post('/:id/update', loanController.update);

/* GET new loan. */
router.get('/new', loanController.readNew);

/* POST one loan. */
router.post('/new', loanController.create);

/* GET one unreturned loan. */
router.get('/:id/return', loanController.readReturn);

/* POST update existing loan. */
router.post('/:id/return', loanController.return);

module.exports = router;
