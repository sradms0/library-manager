'use strict';

/**
 * @module test/lib/testOperations
*/

const { expect } = require('chai');

const { loader } = require('$seed/books');
const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

const bookData = require('$test/data/books.json');
const genreData = require('$test/data/genres.json');

/**
 * Overwrites previous test-database and re-seeds data for testing.
*/
exports.loadTestDb = async function () {
  sequelize.options.logging = false;
  await sequelize.sync({ force:true });
  await loader.load(bookData, genreData, false);
}

/**
 * Finds all table rows containing book data
 * @param {Browser} browser - zombie instance
 * @returns {NodeList} List of a book table rows 
*/
exports.fetchBookTrs = function(browser) {
  return browser.querySelectorAll('tbody tr');
}

/**
 * Navigates to desired route when server is running
 * @param {Browser} browser - zombie instance
 * @param {String} route - route to visit
 * @return {Promise} zombie.Browser.visit
*/
exports.visitRoute = function(browser, route) {
  return browser.visit(`http://localhost:3000/${route}`);
}

/**
 * Navigates to /books route
 * @param {Browser} browser - zombie instance
 * @return {Promise} zombie.Browser.visit
*/
exports.visitBooksRoute = function(browser){
 return exports.visitRoute(browser, 'books');
}

/**
 * Navigates to /books/new route
 * @param {Browser} browser - zombie instance
 * @return {Promise} zombie.Browser.visit
*/
exports.visitNewBookRoute = function(browser){
  return exports.visitRoute(browser, 'books/new');
}

/**
 * Navigates to /books/:id route
 * @param {Browser} browser - zombie instance
 * @return {Promise} zombie.Browser.visit
*/
exports.visitOneBookRoute = function(browser, id){
  return exports.visitRoute(browser, `books/${id}/detail`);
}

