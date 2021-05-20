'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { expect } = chai;

const { error: errorHandler } = require('$controllers');

const { mockRequest, mockResponse } = require('mock-req-res');

chai.use(require('sinon-chai'));


describe('controllers.error.route', () => {
  const next = err => err;
  let res, req;

  beforeEach('', () => {
    res = mockResponse(),
    req = mockRequest();
  });

  it('it should create an error object with a message of \'Page Not Found\'', () => {
    const error = errorHandler.route(req, res, next);
    expect(error?.message).to.equal('Page Not Found');
  });

  it('it should create an error object with a 404 status code', () => {
    const error = errorHandler.route(res, req, next);
    expect(error?.status).to.equal(404);
  });
});


