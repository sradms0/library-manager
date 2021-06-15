'use strict';

const express = require('express');
const { loan: loanController } = require('$controllers');

const router = express.Router();


/* GET loans listing. */
router.get('/', loanController.readAll);

/* GET one loan. */
router.get('/:id/update', loanController.readByPk);

module.exports = router;
