'use strict';

/**
 * @module test/lib/testOperations
*/

const { asyncUtil: { asyncForEach } } = require('$root/lib');
const { loader: bookLoader } = require('$seed/books');
const { loader: loanLoader } = require('$seed/loans');
const { loader: patronLoader } = require('$seed/patrons');
const { sequelize } = require('$database/models');


/**
 * Overwrites previous test-database and re-seeds data for testing.
*/
exports.loadTestDb = async function (...loaderKeys) {
  sequelize.options.logging = false;
  await sequelize.sync({ force:true });
  if (loaderKeys[0] === null) return;

  const loaders = {
    'book':     async () => await bookLoader.load(exports.Data.book, exports.Data.genre, false),
    'patron':   async () => await patronLoader.load(exports.Data.patron, exports.Data.libraryId, false),
    'loan':     async () => await loanLoader.load(exports.Data.loan, false)
  };

  let toLoad = loaderKeys.length ? loaderKeys : Object.keys(loaders);
  await asyncForEach(toLoad, async loaderKey => await loaders[loaderKey]());
}

/**
 * Finds all table rows containing containing data
 * @param {Browser} browser - zombie instance
 * @returns {NodeList} List of a book table rows 
*/
exports.fetchTrs = function(browser) {
  return browser.querySelectorAll('tbody tr');
}

/**
 * Util Class for anything data/model related
 */
exports.Data = class Data {

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
  static async addBooks(creator, total) {
    const books = [];
    for (let i = 0; i < total; i++) {
      books.push(
        await creator({ 
          title: `title ${i}`,
          author: `author ${i}`,
          genre: `genre ${i}`,
          year: i
        })
      );
    }
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
   * Add loans to the current testing database.
   * A new book and patron are first added to the database to then be associated with the new loan.
   * @param {function} creator - the function to add loan data with
   * @param {function} bookCreator - the function to add book data with
   * @param {function} patronCreator - the function to add patron data with
   * @param {number} total - the amount of patrons to add
  */
  static async addLoans(creator, bookCreator, patronCreator, total) {
    const _loanData = exports.Data.loanData();

    const books = await this.addBooks(bookCreator, total),
          patrons = await this.addPatrons(patronCreator, total),
          loans = [];

    for (let i = 0; i < total; i++) {
      const { id: book_id } = books[i]; 
      const { id: patron_id } = patrons[i];
      const loanData = _loanData({ set: {book_id, patron_id} });
      loans.push(await creator(loanData));
    }

    return loans;
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
    return ({ set=null, loanRange=null, del=null, pause=null }={}) => {
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
        else {
          data = { ...data, ...set };
        }
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
   * Creates patron object with empty values
   * @return {object} patron
  */
  static emptyPatron() {
    return exports.Data.patronData()({ allProps:true, val:'' });;
  }
}

/**
 * Util Class for route navigation
*/
exports.Route = class Route {
  /**
   * Navigates to desired route when server is running
   * @param {Browser} browser - zombie instance
   * @param {String} route - route to visit
   * @return {Promise} zombie.Browser.visit
  */
  static visit(browser, route) {
    return browser.visit(`http://localhost:3000/${route}`);
  }

  /**
   * Navigates to / route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitRoot(browser) {
   return this.visit(browser, '');
  }

  /**
   * Navigates to /books route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitBooks(browser) {
   return this.visit(browser, 'books');
  }

  /**
   * Navigates to /loans route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitLoans(browser) {
   return this.visit(browser, 'loans');
  }

  /**
   * Navigates to /patrons route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitPatrons(browser) {
    return this.visit(browser, 'patrons');
  }

  /**
   * Navigates to /books route containing pagination parameters
   * @param {Browser} browser - zombie instance
   * @param {object} params - contains query parameters to paginate from
   * @return {Promise} zombie.Browser.visit
  */
  static visitPaginatedBooks(browser, { page, limit, query=null }) {
    return this.visit(browser, `books${query ? `/search?q=${query}&` : '?'}page=${page}&limit=${limit}`);
  }

  /**
   * Navigates to /patrons route containing pagination parameters
   * @param {Browser} browser - zombie instance
   * @param {object} params - contains query parameters to paginate from
   * @return {Promise} zombie.Browser.visit
  */
  static visitPaginatedPatrons(browser, { page, limit, query=null }) {
    return this.visit(browser, `patrons${query ? `/search?q=${query}&` : '?'}page=${page}&limit=${limit}`);
  }

  /**
   * Navigates to /books/new route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitNewBook(browser) {
    return this.visit(browser, 'books/new');
  }

  /**
   * Navigates to /patrons/new route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitNewPatron(browser) {
    return this.visit(browser, 'patrons/new');
  }

  /**
   * Navigates to /books/:id route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOneBook(browser, id) {
    return this.visit(browser, `books/${id}/update`);
  }

  /**
   * Navigates to /patrons/:id route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOnePatron(browser, id) {
    return this.visit(browser, `patrons/${id}/update`);
  }

  /**
   * Navigates to /books/:id/delete route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOneBookDel(browser, id) {
    return this.visit(browser, `books/${id}/delete`);
  }

  /**
   * Navigates to /patrons/:id/delete route
   * @param {Browser} browser - zombie instance
   * @return {Promise} zombie.Browser.visit
  */
  static visitOnePatronDel(browser, id) {
    return this.visit(browser, `patrons/${id}/delete`);
  }

}
/**
 * Util Class for filling a book-related forms
*/
exports.BookForm = class BookForm {
  /**
   * Clears all books fields.
   * @param {Browser} browser - zombie instance
  */
  static clear(browser) {
    [...browser.querySelectorAll('input.book-detail')].forEach(input => input.value = '');
  } 

  /**
   * Fills the book-search field
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill search field
  */
  static fillSearch(browser, val=null) {
    browser.fill('input[name=q]', val);
  } 

  /**
   * Fills the books title field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill title field (filled if null)
  */
  static fillTitle(browser, val=null) {
    browser.fill('input[name=title]', val ? val : 'new title');
  }

  /**
   * Fills the books author field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill author field (filled if null)
  */
  static fillAuthor(browser, val=null) {
    browser.fill('input[name=author]', val ? val : 'new author');
  } 

  /**
   * Fills the books genre field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill genre field (filled if null)
  */
  static fillGenre(browser, val=null) {
    browser.fill('input[name=genre]', val ? val : 'new genre');
  } 

  /**
   * Fills the books year field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill year field (filled if null)
  */
  static fillYear(browser, val=null) {
    browser.fill('input[name=year]', val ? val : val ? val : '1');
  } 
}

/**
 * Util Class for filling patron-related forms
*/
exports.PatronForm = class PatronForm {
  /**
   * Clears all patron fields.
   * @param {Browser} browser - zombie instance
  */
  static clear(browser) {
    [...browser.querySelectorAll('input.patron-detail')].forEach(input => input.value = '');
  } 

  /**
   * Fills the patron-search field
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill search field
  */
  static fillSearch(browser, val=null) {
    browser.fill('input[name=q]', val);
  } 

  /**
   * Fills the patrons genre field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill genre field (filled if null)
  */
  static fillAddress(browser, val=null) {
    browser.fill('input[name=address]', val ? val : 'new address');
  } 

  /** 
   * Fills the patrons email field
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill email field (filled if null)
  */
  static fillEmail(browser, val=null) {
    browser.fill('input[name=email]', val ? val : 'new_user@mail.com');
  }

  /**
   * Fills the patrons first name field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill first name field (filled if null)
  */
  static fillFirstName(browser, val=null) {
    browser.fill('input[name=first_name]', val ? val : 'newfirst');
  }

  /**
   * Fills the patrons last name field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill last name field (filled if null)
  */
  static fillLastName(browser, val=null) {
    browser.fill('input[name=last_name]', val ? val : 'newlast');
  } 

  /**
   * Fills the patrons library id field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill library id field (filled if null)
  */
  static fillLibraryId(browser, val=null) {
    browser.fill('input[name=library_id]', val ? val : 'newid');
  } 

  /**
   * Fills the patrons zip code field.
   * @param {Browser} browser - zombie instance
   * @param {string} val - value to fill zip code field (filled if null)
  */
  static fillZipCode(browser, val=null) {
    browser.fill('input[name=zip_code]', val ? val : '11111');
  } 

  /**
   * Fills all patron form fields
   * @param {Browser} browser - zombie instance
   * @param {object} data - patrons data to fill fields
  */
  static fillAllWith(browser, data) {
    const _data = { ...data };
    delete _data.name;
    Object.keys(_data).forEach(k => browser.fill(`input[name="${k}"]`, _data[k]));
  }
}

/**
 * Util Class for handling error message extraction and filtering.
*/
exports.Validation = class Validation {
  /**
   * Creates a copy of a validation object and filters out unwanted keys.
   * @param {object} valMsgs - validation object containing validation messages of a model.
   * @param {object} props - validation properties to filter out.
   * @return {object} filtered validation object.
  */
  static withoutVal(valMsgs, { props=[] }={}) {
    return Object.keys(valMsgs)
      .filter(k => props.indexOf(k) < 0)
      .reduce((acc, curr) => ({ ...acc, ...{[curr]: valMsgs[curr]} }), {});
  }

  /**
   * Gets desired validation messages, filtering nested validation keys.
   * @param {object} valMsgs - validation object containing validation messages of a model.
   * @param {object} sansNested - nested validation properties to filter out.
   * @return {object} array of filtered validation messages.
  */
  static getValMsgs(valObjs, { sansNestedKeys=[] }={}) {
    const valObjKeys = Object.keys(valObjs), msgs = [];
    valObjKeys.forEach(k => {
      let nestedKeys = Object.keys(valObjs[k]);
      sansNestedKeys && (
        nestedKeys = nestedKeys.filter(nk => 
          !sansNestedKeys.find(snk => new RegExp(`^${snk}`, 'g').test(nk)))
        );
      nestedKeys.forEach(nk => {
        msgs.push(valObjs[k][nk]);
      })
    });
    return msgs;
  }
}
