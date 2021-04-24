'use strict';

const express = require('express');
const { book: bookController } = require('$controllers');

const router = express.Router();


/* GET books listing. */
router.get('/', bookController.readAll);

/* GET one book. */
router.get('/:id', bookController.readByPk);

/* GET new book. */
router.get('/new', bookController.readNew);

module.exports = router;
