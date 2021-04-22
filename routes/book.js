'use strict';

const express = require('express');
const { book: bookController } = require('$controllers');

const router = express.Router();


/* GET books listing. */
router.get('/', bookController.readAll);

/* GET one book. */
router.get('/:id', bookController.readByPk);

module.exports = router;
