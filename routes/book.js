'use strict';

const express = require('express');
const { book: bookController } = require('$controllers');

const router = express.Router();


/* GET books listing. */
router.get('/', bookController.readAll);

/* GET one book for deletion. */
router.get('/:id/delete', bookController.readDelete);

/* POST book for deletion. */
router.post('/:id/delete', bookController.delete);

/* GET one book. */
router.get('/:id/update', bookController.readByPk);

/* POST update existing book. */
router.post('/:id/update', bookController.update);

/* GET new book. */
router.get('/new', bookController.readNew);

/* POST one book. */
router.post('/new', bookController.create);

module.exports = router;
