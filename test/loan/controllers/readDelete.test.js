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


describe('controllers.loan.readDelete', () => {
  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });
  
  it('it should render loan/delete and pass one loan object', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} }),
          loan = await loanService.readByPk(id);

    await loanController.readDelete(req, res);
    expect(res.render).to.have.been.calledWith('loan/delete', { dataValues: loan });
  });

  it('it should throw an error when a non-existent loan is requested for deletion', async () => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} }),
          loan = await loanService.readByPk(id);

    expect(await loanController.readDelete(req, res, err => err.message))
      .to.equal(`Loan with id ${id} does not exist`);
  });
});
