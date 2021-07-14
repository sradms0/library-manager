'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/loans');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { loan: loanController } = require('$controllers');
const { loan: loanService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.loan.readReturn', () => {
  const nonReturnedId = 1, returnedId = 2;

  before('reload and return one loan', async () => {
    await testOps.Data.loadTestDb();
    const loanToReturn = await loanService.readByPk(returnedId);
    await loanService.update(loanToReturn, { returned_on: new Date() });
  });
  
  it('it should render loan/return and pass one loan object', async () => {
    const res = mockResponse(),
          req = mockRequest({ params: {id: nonReturnedId} }),
          loan = await loanService.readByPk(nonReturnedId);
    await loanController.readReturn(req, res);
    expect(res.render).to.have.been.calledWith('loan/return', { dataValues: loan });
  });

  it('it should throw an error when a non-existent loan is requested for return', async () => {
    const res = mockResponse(),
          badId = -1,
          req = mockRequest({ params: {id: badId} });
    expect(await loanController.readReturn(req, res, err => err.message))
      .to.equal(`Loan with id ${badId} does not exist`);
  });

  it('it should throw an error when a loan has already been returned', async () => {
    const res = mockResponse(),
          req = mockRequest({ params: {id: returnedId} }),
          { returned_on } = await loanService.readByPk(returnedId);
    expect(await loanController.readReturn(req, res, err => err.message))
      .to.equal(`Loan with id ${returnedId} has been returned on ${returned_on}`);
  });
});
