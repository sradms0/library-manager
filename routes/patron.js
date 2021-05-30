'use strict';

const express = require('express');
const { patron: patronController } = require('$controllers');

const router = express.Router();


/* GET patrons listing. */
router.get('/', patronController.readAll);

module.exports = router;
