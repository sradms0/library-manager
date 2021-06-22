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


describe('controllers.loan.readByPk', () => {
  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });
  
  it('it should render loan/update and pass one loan object that includes all Book and Patron instances', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} });

    let loan = await loanService.readByPk(id);

    const { rows: books } = await bookService.readAll(),
          { rows: patrons } = await patronService.readAll();

    loan.books = books;
    loan.patrons = patrons;

    await loanController.readByPk(req, res);
    expect(res.render).to.have.been.calledWith('loan/update', { dataValues: loan });
  });

  it('it should throw an error when a non-existent loan is requested', async () => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} });

    expect(await loanController.readByPk(req, res, err => err.message))
      .to.equal(`Loan with id ${id} does not exist`);
  });
});
