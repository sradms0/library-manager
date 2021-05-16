'use strict';

/**
 * @module lib/errorHandling
*/

/**
 * Validation for handling `SequelizeValidationError`s, re-rendering the current view with previous data entered
 * @param req {object} - the request object from a route
 * @param res {object} - the resolve object from a route
 * @param error {object} - the error that occured during data-transaction
 * @param errorView {string} - the error that occured during data-transaction
 * @param model {object} - the model used to build a temporary model instance based on the previous invalid data
 * @return {boolean} - true, or false, based on if the error was a `SequelizeValidationError`
 *
*/
async function assertValidationError(req, res, error, {errorView=null, model=null}={}) {
  if (error.name == 'SequelizeValidationError') {
    const errors = error.errors.map(item => item.message);
    const { dataValues } = await model.build(req.body);
    dataValues.id = req.params.id;
    res.render(errorView, { dataValues, errors });
    return true;
  }
  return false
}

/**
 * Asynchronous function wrapper for routing
 * @param cb - the asynchronous function to be called
 * @param renderOptions {object} - options to pass to `assertValidationError` (what to render)
 * @return { (req, res, next) } - the wrapper function
*/
exports.asyncHandler = function(cb, renderOptions={}) {
  /**
     Wait for callback function and catch errors, calling error-middleware
   * @param req - the request object from a route
   * @param res - the resolve object from a route
   * @param next - the middleware for error handling
   *
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
