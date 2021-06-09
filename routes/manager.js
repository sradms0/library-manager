'use strict';

const express = require('express');
const { manager: managerController } = require('$controllers');

const router = express.Router();


/* GET listing for manager navigation. */
router.get('/', managerController.home);

module.exports = router;
