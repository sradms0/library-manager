'use strict';

/**
 * Error-handling utitlity functions meant for routing-controllers.
 * @module lib/errorHandling
*/

/**
 * A Model instance assertion to check if an instance is null.
 *
 * @example
 * <caption>Passing a null Model instance.</caption>
 * const badId = -1,
 *       type = 'Book',
 *       nullBook = await bookService.readByPk(badId); //See [services/book#readByPk]{@link module:services/book.readByPk}
 *
 * try {
 *   // An `Error` will be thrown:
 *   assertFind(nullBook, type, badId);
 * } catch(error) {
 *   ...
 * }
 *
 * @example
 * <caption>Passing a valid Model instance.</caption>
 * const goodId = 1,
 *       type = 'Book',
 *       validBook = await bookService.readByPk(goodId); //See [services/book#readByPk]{@link module:services/book.readByPk}
 *
 * try {
 *   // No `Error` thrown:
 *   assertFind(validBook, type, goodId);
 * } catch(error) {
 *   ...
 * }
 *
 * @param instance {Model}  - A Model instance.
 * @param type     {String} - The name of the model.
 * @param id       {Number} - The id of the Model instance.
 * @throws         {Error}  - An error if the instance is null, with a status code of 500.
 *
*/
exports.assertFind = function(instance, type, id) {
  if (!instance) {
    const error = new Error(`${type} with id ${id} does not exist`);
    error.status = 500;
    throw error;
  }
}

/**
 * A Loan instance assertion to check if an instance was returned.
 *
 * @see [Loan]{@link module:models.Loan}
 *
 * @example
 * <caption>Passing a Loan instance with a non-`null` `returned_on` value.</caption>
 * const returnedLoan = await loanService.create({
 *   loaned_on:   loanedOnDate,
 *   return_by:   returnByDate,
 *   returned_on: returnedOnDate,
 *   book_id:     1,
 *   patron_id:   2
 * }); // See [services/loan#create]{@link module:services/loan.create}
 *
 * try {
 *   // An `Error` will be thrown:
 *   assertLoanReturn(returnedLoan);
 * } catch(error) {
 *   ...
 * }
 *
 * @example
 * <caption>Passing a Loan instance with a non-`null` `returned_on` value.</caption>
 * const unreturnedLoan = await loanService.create({
 *   loaned_on:   loanedOnDate,
 *   return_by:   null,
 *   returned_on: returnedOnDate,
 *   book_id:     1,
 *   patron_id:   2
 * }); // See [services/loan#create]{@link module:services/loan.create}
 *
 * try {
 *   // No `Error` thrown:
 *   assertLoanReturn(unreturnedLoan);
 * } catch(error) {
 *   ...
 * }
 *
 * @param {Loan}    loan              - The Loan instance.
 * @param {Number}  loan.id           - The id of the loan.
 * @param {Date}    loan.returned_on  - The date the loan was returned
 * @throws          {Error}           - An error if `returned_on` is not null, with a status code of 403.
 *
*/
exports.assertLoanReturn = function({ id, returned_on }) {
  if (returned_on) {
    const error = new Error(`Loan with id ${id} has been returned on ${returned_on}`);
    error.status = 403;
    throw error;
  }
}

/**
 * Validation for handling `SequelizeValidationError`s, re-rendering the current view with previous data entered.
 * @see [Request]{@link external:Request}
 * @see [Response]{@link external:Response}
 * @see [UniqueConstraintError]{@link external:UniqueConstraintError}
 * @see [ValidationError]{@link external:ValidationError}
 *
 * @example
 * <caption>Creating a `Model` instance that triggers validation-errors. </caption>
 * // A `Request` object will have its `body` object contain data for creating or updating a `Model` instance.
 * // e.g.: creating a `Book` model that will trigger validation-errors: 
 * req.body = { title: '', author: ''};
 *
 * // Errors will be contain `ValidationErrorItem` objects from `sequelize` validation checking:
 * error.errors = [
 *  { message: '"Title" is required', type: 'Validation error', ..., ..., ... },
 *  { message: '"Author" is required', type: 'Validation error', ..., ..., ... }
 * ];

 * renderOptions = { errorView: 'book/new', model: bookService.model } 
 * // Creating a book with empty properties will cause the function to render the `book/new` template, specified in the `renderOptions` parameter-object
 * const hasValErr = await assertValidationError(req, res, error, renderOptions);
 *
 * // See [asyncHandler]{@link module:lib/errorHandling.asyncHandler} source-code.
 *
 * @async
 * @function
 * @param   {Request}         req                                 - The request object from a route.
 * @param   {Response}        res                                 - The resolve object from a route.
 * @param   {ValidationError} error                               - The error that occured during data-transaction.
 * @param   {RenderOptions}   [renderOptions={}]                  - Render options for templated error-view.
 * @param   {String}          [renderOptions.erroView=null]       - The template to render errors to.
 * @param   {addToBuild}      [renderOptions.addToBuild=()=>({})] - The template to render errors to.
 * @return  {Boolean}                                             - True or false, based on the error being a `ValidationError` or `UniqueConstraintError`.
 *
*/
async function assertValidationError(req, res, error, {errorView=null, addToBuild=()=>({})}={}) {
  const flaggedErrors = ['SequelizeValidationError', 'SequelizeUniqueConstraintError'];

  if (flaggedErrors.indexOf(error.name) >= 0) {
    const errors = error.errors.map(item => item.message).sort();

    const { body, params: { id } } = req;
    const dataValues = { ...body, ...await addToBuild({...req}) };
    dataValues.id = id ?? null;

    res.render(errorView, { dataValues, errors });
    return true;
  }
  return false
}

/**
 * @callback cb
 * @returns {*}
*/

/**
 * Asynchronous Handler that generates an asynchronous function with 
 * validation checking and error-handling for routing-controllers.
 *
 * @see [asyncWrapper]{@link module:lib/errorHandling~asyncWrapper}
 *
 *
 * @example
 * <caption>A function that will create a new Book instance, protecting the operation from errors.</caption>
 * const createBook = asyncHandler(async function(req, res) {
 *   const { body } = req;
 *   await bookService.create(body);
 *   res.redirect('/books/all?page=1&limit=10');
 * }, { errorView: 'book/new', model: bookService.model });
 *
 * @param   {cb}            cb                  - the asynchronous function to be called
 * @param   {RenderOptions} [renderOptions={}]  - Options to pass to `assertValidationError` for error rendering.
 * @returns {Function}                          - the wrapper function
*/
exports.asyncHandler = function(cb, renderOptions={}) {
  /**
   * Waits for callback function and catches errors, calling error-middleware if needed.
   *
   * @see [Request]{@link external:Request}
   * @see [Response]{@link external:Response}
   * @async
   * @function
   * @name asyncWrapper
   * @param {Request}   req   - The request object from a route.
   * @param {Response}  res   - The resolve object from a route.
   * @param {Function}  next  - The middleware for error-handling.
   * @return {*}
  */
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      try {
        if (await assertValidationError(req, res, error, renderOptions))
          return;
      } catch(error) { console.log(error); }
      return next ? next(error) : null;
    }
  }
}
