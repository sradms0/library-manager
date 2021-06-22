'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { patron: patronService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.patron.readAll', () => {
  before('reload', async () => {
    await testOps.Data.loadTestDb('patron');
  });

  it('it should return a Promise', () => {
    expect(patronService.readAll() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a patron total', async () => {
    const { count } = await patronService.readAll();
    expect(count).to.equal(testOps.Data.patron.length);
  });

  it('it should return a Promise resolving to an object with an array of Patron instances', async () => {
    const { rows } = await patronService.readAll();
    rows.forEach(patron => expect(patron instanceof patronService.model).to.be.true);
  });

  it('it should return all patrons from the database', async () => {
    const { count: dbPatronCount, rows: dbPatrons} = await patronService.readAll(),
          rawPatrons = testOps.Data.patron;

    const matched = dbPatronCount === rawPatrons.length && 
                    rawPatrons.every((rp, idx) => rp.email === dbPatrons[idx].email);
    expect(matched).to.be.true;
  });

  describe('limit and offset', async () => {
    let allPatrons, limitedPatrons, 
        offset = 0, limit = 0;

    before('create more instances for pagination', async () => {
      await testOps.Data.addPatrons(patronService.create, 20);
      ({ rows: allPatrons } = await patronService.readAll());
    });

    describe('limit', async () => {
      it('it should return a limit of one patron', async () => {
        limit = 1;
        let [ { email: firstEmail } ] = allPatrons?.slice(offset,limit);
        let { rows: [ {email: limitedEmail} ]} = await patronService.readAll({ offset, limit });
        expect(firstEmail).to.equal(limitedEmail);
      });

      it('it should return a limit of some patrons', async () => {
        limit = Math.ceil(allPatrons.length/2);
        const somePatrons = allPatrons?.slice(offset,limit);
        limitedPatrons = await patronService.readAll({ offset, limit });
        somePatrons.forEach((patron, idx) =>  expect(patron.email === limitedPatrons.rows[idx].email));
      });

      it('it should return a limit of no patrons', async () => {
        limit = offset = 0;
        let { rows: noPatrons } = await patronService.readAll({ offset, limit });
        expect(noPatrons).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one patron with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ { email: secondEmail } ] = allPatrons?.slice(offset,limit+1);
        const { rows: [ {email: limitedSecondEmail} ] } = await patronService.readAll({ offset, limit });
        expect(secondEmail).to.equal(limitedSecondEmail);
      });

      it('it should return a limit of some patrons with an offset greater than zero', async () => {
        limit = Math.ceil(allPatrons.length/2);
        const somePatrons = allPatrons?.slice(limit+1);
        limitedPatrons = await patronService.readAll({ offset, limit });
        somePatrons.forEach((patron, idx) => expect(patron.email === limitedPatrons.rows[idx].email));
      });

      it('it should return a limit of no patrons with an offset greater than total patrons', async () => {
        limit = 1, offset = await patronService.model.count();
        let { rows: noPatrons } = await patronService.readAll({ offset, limit });
        expect(noPatrons).to.be.empty;
      });
    });
  });
});

