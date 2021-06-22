'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { patron: patronService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.patron.readByPk', async () => {
  let id = 100;

  before('reload', async () => {
    await testOps.Data.loadTestDb('patron');
    await patronService.create(testOps.Data.patronData()({ prop: 'id', val: id }));
  });

  it('it should return a Promise', async () => {
    expect(patronService.readByPk(id) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to a Patron instance', async () => {
    expect((await patronService.readByPk(id)) instanceof patronService.model).to.be.true;
  });

  it('it should return null when finding a non-existent patron primary key', async () => {
    expect(await patronService.readByPk(-1)).to.be.null;
  });
});

