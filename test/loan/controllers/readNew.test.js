'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/loans');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { loan: loanController } = require('$controllers');
const { 
  book: bookService,
  loan: loanService,
  patron: patronService 
} = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));

// generating pre-filled dates will differ by milliseconds, so res.renders arg checks have to be split up
// in order to parse and check date comparisons between `res` `dataValues` arg and and expected `dataValues`.
describe('controllers.loan.readNew', () => {
  before('reload', async () => {
    await testOps.Data.loadTestDb('book', 'patron');
  })
  const attrs = testOps.Data.getModelAttrs(loanService.model);

  it('it should render loan/new', async () => {
    const res = mockResponse(),
          req = mockRequest();
    await loanController.readNew(req, res);
    expect(res.render.firstCall.firstArg).to.equal('loan/new');
  });

  it('it should pass empty data-values, all book and patron instances, and default dates to res.render', async () => {
    const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {}),
          res = mockResponse(),
          req = mockRequest();
    const { rows: books } = await bookService.readAll(),
          { rows: patrons } = await patronService.readAll();

    dataValues.loaned_on = new Date();
    dataValues.return_by = testOps.Data.getFutureOrPastDate(dataValues.loaned_on, 7);
    dataValues.books = books;
    dataValues.patrons = patrons;

    const emptyAttrs = attrs.filter(attr => !dataValues[attr]);
    await loanController.readNew(req, res);

    const { firstCall: {lastArg: {dataValues:resDataValues}} } = res.render;

    const onlyEmptyExpDataValues = emptyAttrs.reduce((acc, curr) => ({
      ...acc, ...{[curr]: dataValues[curr]}
    }), {}),
          onlyEmptyResDataValues = emptyAttrs.reduce((acc, curr) => ({
      ...acc, ...{[curr]: resDataValues[curr]}
    }), {});

    const resHasEmptyAttrs = JSON.stringify(onlyEmptyExpDataValues) === JSON.stringify(onlyEmptyResDataValues),
          resHasLoanDates = ['loaned_on', 'return_by'].every(attr => {
            const re = /\w+ \w+ \d+ \d+/;
            return (''+dataValues[attr]).match(re)[0] === (''+resDataValues[attr]).match(re)[0];
          });

    const resHasAllBooks = JSON.stringify(resDataValues.books) === JSON.stringify(dataValues.books),
          resHasAllPatrons = JSON.stringify(resDataValues.patrons) === JSON.stringify(dataValues.patrons);

    const resPassesExpDataVals = resHasEmptyAttrs && resHasLoanDates && resHasAllBooks && resHasAllPatrons;
    expect(resPassesExpDataVals).to.be.true;
  });
});

