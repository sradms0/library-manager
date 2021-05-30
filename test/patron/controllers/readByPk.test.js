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


describe('controllers.patron.readByPk', () => {
  before('reload', async () => {
    await testOps.loadTestDb('patron');
  });
  
  it('it should render patron/update and pass one patron object', async () => {
    const res = mockResponse(),
          id = 1,
          req = mockRequest({ params: {id} }),
          patron = await patronService.readByPk(id);

    await patronController.readByPk(req, res);
    expect(res.render).to.have.been.calledWith('patron/update', { dataValues: patron });
  });

  it('it should throw an error when a non-existent patron is requested', async () => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} }),
          patron = await patronService.readByPk(id);

    expect(await patronController.readByPk(req, res, err => err.message))
      .to.equal(`Patron with id ${id} does not exist`);
  });
});
