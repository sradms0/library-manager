'use strict';

/**
 * @module test/lib/Data
*/

const { asyncUtil: { asyncForEach } } = require('$root/lib');
const { loader: bookLoader }          = require('$seed/books');
const { loader: loanLoader }          = require('$seed/loans');
const { loader: patronLoader }        = require('$seed/patrons');
const { sequelize }                   = require('$database/models');

/**
 * Util Class for anything data/model related
 */
module.exports = class {
  /** raw book-data */
  static book = require('$test/data/books.json');

  /** raw loan-data */
  static loan = require('$test/data/loans.json');

  /** raw patron-data */
  static patron = require('$test/data/patrons.json');

  /** raw genre-data */
  static genre = require('$test/data/genres.json');

  /** raw library-id-data */
  static libraryId = require('$test/data/libraryIds.json');

  /**
   * Overwrites previous test-database and re-seeds data for testing.
  */
  static async loadTestDb(...loaderKeys) {
    sequelize.options.logging = false;
    const { options: { logging } } = sequelize;

    await sequelize.sync({ force:true });
    if (loaderKeys[0] === null) return;

    const loaders = {
      'book':     async () => await bookLoader.load(this.book, this.genre, logging),
      'patron':   async () => await patronLoader.load(this.patron, this.libraryId, logging),
      'loan':     async () => await loanLoader.load(this.loan, logging)
    };

    let toLoad = loaderKeys.length ? loaderKeys : Object.keys(loaders);
    await asyncForEach(toLoad, async loaderKey => await loaders[loaderKey]());
  }

  /**
   * Date modifier that some date in the past, or future.
   * @param {object} date - Date object to operate from
   * @param {number} days - days before, or after, date.
   * @return {object} past or future date
  */
  static getFutureOrPastDate(date, days) {
    return new Date(date.getTime()+(days*8.64e+7));
  }

  /** 
   * Find attribute keys of a model.
   * @param {object} model - model to grab attribute keys from
   * @returns {object} array of attribute keys
  */
  static getModelAttrs(model, { without=null }={}) {
    let keys = Object.keys(model.rawAttributes);
    return (without ? keys.filter(key => without.indexOf(key) < 0) : keys);
  }

  /** 
   * Add books to the current testing database.
   * @param {function} creator - the function to add book data with
   * @param {number} total - the amount of books to add
   * @return {object} array of books
  */
  static async addBooks(creator, total, bookDataSetter={}) {
    const _bookData = this.bookData();

    const books = [];
    for (let i = 0; i < total; i++) 
      books.push( await creator(_bookData({ ...bookDataSetter })) );
    return books;
  }

  /**
   * Gets validation messages for a model by its name.
   * @param {string} modelName - the name of the model for which to extract validation messages from.
   * @return {object} validation messages
  */
  static getModelValidationErrorMessages(modelName) {
    return require('$database/models/validationMessages')[modelName.toLowerCase()];
  }

  /** 
   * Add patrons to the current testing database.
   * @param {function} creator - the function to add patron data with
   * @param {number} total - the amount of patrons to add
   * @return {object} array of patrons
  */
  static async addPatrons(creator, total) {
    const patrons = [];
    for (let i = 1; i <= total; i++) {
      patrons.push(
        await creator({ 
          first_name: `first`,
          last_name: `last`,
          address: `address ${i}`,
          email: `user${i}@mail.com`,
          library_id: `library_id${i}`,
          zip_code: (''+i).repeat(5).substring(0,5)
        })
      );
    }
    return patrons;
  }

  /**
   * Adds un/associated data to an attempted loan instance after validation errors have been thrown.
   * This added data is what is expected after going through an error-validation handler.
   * @param {object} preLoan - loan-data before being passed to some create or update operation
   * @param {object} [allDataReaders] - data functions to read all rows from desired tables.
   * @param {function} allDataReaders.allBooksReader - reads all Books rows.
   * @param {function} allDataReaders.allPatronsReader - reads all Patrons rows.
   *
   * @param {object} [associationInclusions={}] - determines if associations will be included.
   * @param {object} [associationInclusions.book=null] - determines if book association is included.
   * @param {object} [associationInclusions.patron=null] - determines if patron association is included.
   *
   * @param {object} [singleDataReaders={}] - data functions to read single associative model instances.
   * @param {function} [singleDataReaders.oneBookReader=null] - reads the associated book.
   * @param {function} [singleDataReaders.onePatronReader=null] - reads the assoicated patron.
  */
   static async addPostErrDataToLoan(preLoan, 
   { allBooksReader, allPatronsReader}, 
   { book=null, patron=null }={}, 
   { oneBookReader=null, onePatronReader=null }={}) {

    const { book_id, patron_id } = preLoan;
    preLoan.Book = book && await oneBookReader(book_id);
    preLoan.Patron = patron && await onePatronReader(patron_id);
    preLoan.books = (await allBooksReader()).rows;
    preLoan.patrons = (await allPatronsReader()).rows;
  }

  /** 
   * Add loans to the current testing database.
   * A new book and patron are first added to the database to then be associated with the new loan.
   * @param {function} creator - the function to add loan data with
   * @param {function} bookCreator - the function to add book data with
   * @param {function} patronCreator - the function to add patron data with
   * @param {number} total - the amount of loans to add
   * @param {object=} [loanDataSetter] - optional new-loan property configuration setter.
   * @returns {object} an array of loans.
  */
  static async addLoans(creator, bookCreator, patronCreator, total, loanDataSetter={}) {
    const _loanData = this.loanData();

    const books = await this.addBooks(bookCreator, total),
          patrons = await this.addPatrons(patronCreator, total),
          loans = [];

    for (let i = 0; i < total; i++) {
      const { id: book_id } = books[i]; 
      const { id: patron_id } = patrons[i];
      const loanData = await _loanData({ set: {book_id, patron_id, ...loanDataSetter} });
      loans.push(await creator(loanData));
    }

    return loans;
  }

  /** 
   * Add loans to a specific book, each with a different patron.
   * Enough patrons should exist beforehand.
   * @param {function} creator - the function to add loan data with.
   * @param {number} bookId - the book id to associate a loan with.
   * @param {number} patronIdStart - the starting id of a patron-id range.
   * @param {number} total - the amount of loans to add.
   * @returns {object} an array of loans.
  */
  static async addLoansToBook(creator, bookId, patronIdStart, total) {
    const _loanData = this.loanData(),
          loans = [];
    for (let i = 0; i < total; i++) {
      const loanData = await _loanData({ set: { book_id: bookId, patron_id: patronIdStart++ }});
      loans.push(await creator(loanData));
    }
    return loans;
  }

  /** 
   * Add loans to a specific patron, each with a different book.
   * Enough books should exist beforehand.
   * @param {function} creator - the function to add loan data with.
   * @param {number} patronId - the patron id to associate a loan with.
   * @param {number} bookIdStart - the starting id of a book-id range.
   * @param {number} total - the amount of loans to add.
   * @returns {object} an array of loans.
  */
  static async addLoansToPatron(creator, patronId, bookIdStart, total) {
    const _loanData = this.loanData(),
          loans = [];
    for (let i = 0; i < total; i++) {
      const loanData = await _loanData({ set: { patron_id: patronId, book_id: bookIdStart++ }});
      loans.push(await creator(loanData));
    }
    return loans;
  }

  static bookData() {
    let counter = 1;
    return ({ set=null, del=null, pause=null }={}) => {

      let title = `title ${counter}`,
          author = `author ${counter}`,
          genre = `genre ${counter}`,
          year = counter,
          data = { 
            title,
            author,
            genre,
            year,
          };

      if (set) {
        if ('all' in set)
          Object.keys(data).forEach(key => data[key] = set.all);
        else
          data = { ...data, ...set };
      }

      if (del) {
        const delKeys = del === 'all' ? Object.keys(data) : del;
        delKeys.forEach(key => delete data[key])
      }

      !pause && counter++;
      return data;
    }
  }

  static patronData() {
    let counter = 1;
    return ({ prop=null, allProps=false, val=null, del=false, pause=false }={}) => {
      const data = {
        first_name: `first`, 
        last_name: `last`,
        name: `first last`,
        email: `user${counter}@mail.com`,
        address: `street${counter}`,
        zip_code: `${ (''+counter).repeat(5).substring(0,5) }`,
        library_id: `library_id${counter}`
      };

      if (prop) {
        if (val !== null) data[prop] = val;
        else if (del) delete data[prop];
      } else if(allProps && val !== null) {
        Object.keys(data).forEach(key => data[key] = val)
      }

      !pause && counter++;
      return data;
    }
  }

  static loanData() {
    let counter = 1;
    return async ({ bookRead=null, patronRead=null, set=null, loanRange=null, del=null, pause=null }={}) => {
      loanRange ??= 7;

      let loaned_on = new Date(),
            return_by = new Date(loaned_on.getTime()+(loanRange*(8.64e+7))),
            returned_on = null,
            data = { 
              loaned_on, 
              return_by, 
              returned_on, 
              book_id: counter, 
              patron_id: counter 
            };

      if (set) {
        if ('all' in set)
          Object.keys(data).forEach(key => data[key] = set.all);
        else
          data = { ...data, ...set };
      }

      if (bookRead && patronRead) {
        data.Book = (await bookRead(data.book_id)).toJSON();
        data.Patron = (await patronRead(data.patron_id)).toJSON();
      }

      if (del) {
        const delKeys = del === 'all' ? Object.keys(data) : del;
        delKeys.forEach(key => delete data[key])
      }

      !pause && counter++;
      return data;
    }
  }

  /**
   * Creates loan object with empty values
   * @returns {Promise}
  */
  static emptyLoan() {
    return this.loanData()({ set: {'all': ''} });;
  }

  /**
   * Creates patron object with empty values
   * @return {object} patron
  */
  static emptyPatron() {
    return this.patronData()({ allProps:true, val:'' });;
  }
}
