'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { loan: loanService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.loan.delete', () => {
  let loan;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  beforeEach('fetch first available loan to delete', async () => {
    ({ rows: [loan] } = await loanService.readAll());
  });

  it('it should return a promise', async () => {
    expect(loanService.delete(loan) instanceof Promise).to.be.true;
  });

  it('it should return a promise resolving to the Loan instance deleted', async () => {
    expect((await loanService.delete(loan)) instanceof loanService.model).to.be.true;
  });

  it('it should delete an existing loan', async () => {
    const { id } = loan;
    await loanService.delete(loan);
    expect(await loanService.readByPk(id)).to.be.null;
  });
});

