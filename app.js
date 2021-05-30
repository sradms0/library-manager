'use strict';

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

const { book: bookRouter, patron: patronRouter } = require('./routes');

const { error: errorController } = require('$controllers');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// server config 
app.use(logger('dev', { skip: (req, rest) => process.env.NODE_ENV === 'test' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// routers
app.use('/books', bookRouter);
app.use('/patrons', patronRouter);

app.use(errorController.route, errorController.global);

module.exports = app;
