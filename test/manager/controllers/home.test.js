
'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { expect } = chai;
const server = require('$root/app');

const { manager: managerController } = require('$controllers');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.manager.home', () => {
  it('it should call res.render with index with limited/offset pagination configuration', async () => {
    const res = mockResponse(),
          req = mockRequest();
    const page = 1, 
          limit = 10;
    managerController.home(req, res);
    expect(res.render).to.have.been.calledWith('index', { page, limit });
  });
});
