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


describe('controllers.loan.delete', () => {
  let id;

  beforeEach('fetch first available loan to delete', async () => {
    await testOps.Data.loadTestDb();
    const { rows: [loan] } = (await loanService.readAll());
    id = loan ? loan.id : -1;
  });

  it('it should throw an error when a non-existent loan deletion is attempted', async() => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} });
    expect(await loanController.delete(req, res, err => err.message))
      .to.equal(`Loan with id ${id} does not exist`);
  });

  it('it should delete an existing loan', async() => {
    const res = mockResponse(),
          req = mockRequest({ params: {id} });
    await loanController.delete(req, res);
    expect(await loanService.readByPk(id)).to.be.null;
  });

  it('it should redirect the user to /loans/all after a loan is deleted', async () => {
    const res = mockResponse(),
          req = mockRequest({ params: {id} });
    await loanController.delete(req, res);
    expect(res.redirect).to.have.been.calledWith('/loans/all');
  });
});
