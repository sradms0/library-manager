'use strict';

const express = require('express');
const { book: bookController } = require('$controllers');

const router = express.Router();


/* GET books listing. */
router.get('/', bookController.readAll);

/* GET new book. */
router.get('/new', bookController.readNew);

/* GET one book. */
router.get('/:id', bookController.readByPk);

/* POST one book. */
router.post('/:id', bookController.create);

module.exports = router;
