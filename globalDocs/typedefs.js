/** 
 * An object-literal representing a `Book` instance.
 * @typedef   {Object} BookLiteral
 * @property  {String} title        - The title of a book.
 * @property  {String} author       - The author of a book.
 * @property  {String} genre        - The genre of a book.
 * @property  {Number} year         - The published year of a book.
*/

/**
 * An object-literal representing a `Loan` instance.
 * @typedef   {Object} LoanLiteral
 * @property  {Number} book_id      - The ID of a `Book` instance the loan is associated with.
 * @property  {Number} patron_id    - The ID of a `Patron` instance the loan is associated with.
 * @property  {Date}   loaned_on    - The date the book was loaned.
 * @property  {Date}   return_by    - The date the book should be returned.
 * @property  {Date}   returned_on  - The date the book was returned.
 *
*/

/**
 * An object-literal with a set of options for rendering a template-view.
 * @typedef   {Object}      RenderOptions
 * @property  {String}      errorView     - The template-name to render errors to.
 * @property  {addToBuild}  addToBuild    - Any custom data to add to an errored `Model` instance.
*/

exports.unused = {};
