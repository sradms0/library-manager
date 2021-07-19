'use strict';

const express = require('express');
const { patron: patronController } = require('$controllers');

const router = express.Router();


/* GET patrons listing. */
router.get('/', patronController.readAll);

/* GET one patron for deletion. */
router.get('/:id/delete', patronController.readDelete);

/* POST patron for deletion. */
router.post('/:id/delete', patronController.delete);

/* GET one patron. */
router.get('/:id/update', patronController.readByPk);

/* POST update existing patron. */
router.post('/:id/update', patronController.update);

/* GET new patron. */
router.get('/new', patronController.readNew);

/* POST one patron. */
router.post('/new', patronController.create);

/* GET patrons of overdue loans listing. */
router.get('/overdue', patronController.readOverdue);

/* GET searched patrons. */
router.get('/search', patronController.readByAttrs);

module.exports = router;
