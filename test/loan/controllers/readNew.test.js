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


describe('controllers.loan.readNew', () => {
  const attrs = testOps.Data.getModelAttrs(loanService.model, { without: 'name' });

  it('it should render loan/new', () => {
    const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {}),
          res = mockResponse(),
          req = mockRequest();
    loanController.readNew(req, res);
    expect(res.render).to.have.been.calledWith('loan/new', { dataValues });
  });
});

