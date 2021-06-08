'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/patrons');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { patron: patronController } = require('$controllers');
const { patron: patronService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.patron.readNew', () => {
  const attrs = testOps.Data.getModelAttrs(patronService.model, { without: 'name' });

  it('it should render patron/new', () => {
    const dataValues = attrs.reduce((acc, curr) => ({...acc, ...{[curr]: ''}}), {}),
          res = mockResponse(),
          req = mockRequest();
    patronController.readNew(req, res);
    expect(res.render).to.have.been.calledWith('patron/new', { dataValues });
  });
});

