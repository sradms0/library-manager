'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { expect } = chai;

const { error: errorHandler } = require('$controllers');

const { stub, match } = require('sinon');
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


describe('controllers.error.global', () => {
  const next = err => err;
  let res, req;

  beforeEach('', () => {
    res = mockResponse(),
    req = mockRequest();
  });

  it('it should render views/error after receiving an error', () => {
    const error = { message: '', status: 404 };
    errorHandler.global(error, req, res);
    expect(res.render).to.have.been.calledWith('error', { error });
  });

  it('it should set res.status to error.status when it exists', () => {
    const error = { message: '', status: 404 };
    errorHandler.global(error, req, res);
    expect(res.status).to.have.been.calledWith(error.status);
  });

  it('it should set res.status to 500 when error.status doesn\'t exists', () => {
    const error = { message: '' };
    errorHandler.global(error, req, res);
    expect(res.status).to.have.been.calledWith(500);
  });
});
