'use strict';

/**
 * Manager routes.
 * @module routes/manager
*/

const express = require('express');
const { manager: managerController } = require('$controllers');

const router = express.Router();


/**
 * A route for viewing the systems navigation.
 * @name get/
 * @function
*/
router.get('/', managerController.home);

module.exports = router;
