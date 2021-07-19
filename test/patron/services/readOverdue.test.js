'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

const { 
  book: bookService, 
  loan: loanService,
  patron: patronService 
} = require('$services');



describe('services.loan.readOverdue', () => {
  const { Op } = require('sequelize');

  const where = {
    [Op.and]: [
      { '$Loans.returned_on$': null },
      { '$Loans.return_by$': { [Op.lt]: new Date() } }
    ]}, include = { model: loanService.model };

  let overdue;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');

    const { Data: {getFutureOrPastDate: fOP} } = testOps,
          today = new Date();

    overdue = await testOps.Data.addLoans(
      loanService.create, 
      bookService.create, 
      patronService.create,
      20, { 
        loaned_on: fOP(today, -2),
        return_by: fOP(today, -1)
      }
    );
  });

  it('it should return a Promise', () => {
    expect(patronService.readOverdue() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a patron total', async () => {
    const { count, rows } = await patronService.readOverdue();
    expect(count).to.equal(overdue.length);
  });

  it('it should return a Promise resolving to an object with an array of Patron instances', async () => {
    const { rows } = await patronService.readOverdue();
    rows.forEach(patron => expect(patron instanceof patronService.model).to.be.true);
  });

  it('it should return only overdue patrons from the database', async () => {
    const { count: overduePatronCount, rows: overduePatrons} = await patronService.readOverdue(),
          expectedOverduePatrons = await patronService.model.findAll({ where, include });

    const matched = overduePatronCount === expectedOverduePatrons.length && 
                    expectedOverduePatrons.every((eOP, idx) => eOP.name === overduePatrons[idx].name);
    expect(matched).to.be.true;
  });

  describe('limit and offset', async () => {
    let allOverduePatrons, limitedPatrons, 
        offset = 0, limit = 0;

    before('fetch all overdue patrons', async () => {
      allOverduePatrons = await patronService.model.findAll({ where, include });
    });

    describe('limit', async () => {
      it('it should return a limit of one patron', async () => {
        limit = 1;
        let [ { name: firstPatron } ] = allOverduePatrons?.slice(offset,limit);
        let { rows: [ {name: limitedFirstPatron} ]} = await patronService.readOverdue({ offset, limit });
        expect(firstPatron).to.equal(limitedFirstPatron);
      });

      it('it should return a limit of some patrons', async () => {
        limit = Math.ceil(allOverduePatrons.length/2);
        const somePatrons = allOverduePatrons?.slice(offset,limit);
        limitedPatrons = await patronService.readOverdue({ offset, limit });
        somePatrons.forEach((patron, idx) => expect(patron.name === limitedPatrons.rows[idx].name));
      });

      it('it should return a limit of no patrons', async () => {
        limit = offset = 0;
        let { rows: noPatrons } = await patronService.readOverdue({ offset, limit });
        expect(noPatrons).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one patron with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ { name: secondPatron } ] = allOverduePatrons?.slice(offset,limit+1);
        const { rows: [ {name: limitedSecondPatron} ] } = await patronService.readOverdue({ offset, limit });
        expect(secondPatron).to.equal(limitedSecondPatron);
      });

      it('it should return a limit of some patrons with an offset greater than zero', async () => {
        limit = Math.ceil(allOverduePatrons.length/2);
        const somePatrons = allOverduePatrons?.slice(limit+1);
        limitedPatrons = await patronService.readOverdue({ offset, limit });
        somePatrons.forEach((patron, idx) => expect(patron.name === limitedPatrons.rows[idx].name));
      });

      it('it should return a limit of no patrons with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noPatrons } = await patronService.readOverdue({ offset, limit });
        expect(noPatrons).to.be.empty;
      });
    });
  });
});

