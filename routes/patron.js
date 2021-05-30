'use strict';

const express = require('express');
const { patron: patronController } = require('$controllers');

const router = express.Router();


/* GET patrons listing. */
router.get('/', patronController.readAll);

/* GET one patron. */
router.get('/:id/update', patronController.readByPk);

module.exports = router;
