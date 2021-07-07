'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { patron: patronService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.patron.delete', () => {
  let patron;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  beforeEach('fetch first available patron to delete', async () => {
    ({ rows: [patron] } = await patronService.readAll());
  });

  it('it should return a promise', async () => {
    expect(patronService.delete(patron) instanceof Promise).to.be.true;
  });

  it('it should return a promise resolving to the Patron instance deleted', async () => {
    expect((await patronService.delete(patron)) instanceof patronService.model).to.be.true;
  });

  it('it should delete an existing patron', async () => {
    const { id } = patron;
    await patronService.delete(patron);
    expect(await patronService.readByPk(id)).to.be.null;
  });
});

