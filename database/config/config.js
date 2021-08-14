'use strict';

require('dotenv').config();

module.exports = {
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect:  process.env.DB_DIALECT,
    database: process.env.DB_DATABASE,
    host:     process.env.DB_HOST
  }
}
