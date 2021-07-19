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


describe('controllers.patron.delete', () => {
  let id;

  beforeEach('fetch first available patron to delete', async () => {
    await testOps.Data.loadTestDb('patron');
    const { rows: [patron] } = (await patronService.readAll());
    id = patron ? patron.id : -1;
  });

  it('it should throw an error when a non-existent patron deletion is attempted', async() => {
    const res = mockResponse(),
          id = -1,
          req = mockRequest({ params: {id} });
    expect(await patronController.delete(req, res, err => err.message))
      .to.equal(`Patron with id ${id} does not exist`);
  });

  it('it should delete an existing patron', async() => {
    const res = mockResponse(),
          req = mockRequest({ params: {id} });
    await patronController.delete(req, res);
    expect(await patronService.readByPk(id)).to.be.null;
  });

  it('it should redirect the user to /patrons/all?page=1&limit=10 after a patron is deleted', async () => {
    const res = mockResponse(),
          req = mockRequest({ params: {id} });
    await patronController.delete(req, res);
    expect(res.redirect).to.have.been.calledWith('/patrons/all?page=1&limit=10');
  });
});
