'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { asyncUtil: {asyncForEach} } = require('$root/lib');
const { expect } = chai;

const { 
  book: bookService, 
  loan: loanService,
  patron: patronService 
} = require('$services');



describe('services.patron.readCheckedOut', () => {
  const { Op } = require('sequelize');

  const where = {
    [Op.and]: [
      { [Op.not]: {'$Loans.book_id$': null} },
      { '$Loans.returned_on$': null }        
    ]
  }, include = { model: loanService.model };

  let checkedOut;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book');

    // create loans, but return some
    await testOps.Data.addLoans(
      loanService.create, 
      bookService.create, 
      patronService.create,
      20
    );
    const { rows: dbLoans } = await loanService.readAll({ limit: 10, offset: 1 });
    asyncForEach(dbLoans, async loan => 
      await loanService.update(loan, { returned_on: today })
    );
    checkedOut = await bookService.model.findAll({ where, include });
  });

  it('it should return a Promise', () => {
    expect(patronService.readCheckedOut() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a patron total', async () => {
    const { count, rows } = await patronService.readCheckedOut();
    expect(count).to.equal(checkedOut.length);
  });

  it('it should return a Promise resolving to an object with an array of Patron instances', async () => {
    const { rows } = await patronService.readCheckedOut();
    rows.forEach(patron => expect(patron instanceof patronService.model).to.be.true);
  });

  it('it should return only checkedOut patrons from the database', async () => {
    const { count: checkedOutPatronCount, rows: checkedOutPatrons} = await patronService.readCheckedOut(),
          expectedCheckedOutPatrons = await patronService.model.findAll({ where, include });

    const matched = checkedOutPatronCount === expectedCheckedOutPatrons.length && 
                    expectedCheckedOutPatrons.every((eOP, idx) => eOP.name === checkedOutPatrons[idx].name);
    expect(matched).to.be.true;
  });

  describe('limit and offset', async () => {
    let allCheckedOutPatrons, limitedPatrons, 
        offset = 0, limit = 0;

    before('fetch all checked-out patrons', async () => {
      allCheckedOutPatrons = await patronService.model.findAll({ where, include });
    });

    describe('limit', async () => {
      it('it should return a limit of one patron', async () => {
        limit = 1;
        let [ { name: firstPatron } ] = allCheckedOutPatrons?.slice(offset,limit);
        let { rows: [ {name: limitedFirstPatron} ]} = await patronService.readCheckedOut({ offset, limit });
        expect(firstPatron).to.equal(limitedFirstPatron);
      });

      it('it should return a limit of some patrons', async () => {
        limit = Math.ceil(allCheckedOutPatrons.length/2);
        const somePatrons = allCheckedOutPatrons?.slice(offset,limit);
        limitedPatrons = await patronService.readCheckedOut({ offset, limit });
        somePatrons.forEach((patron, idx) => expect(patron.name === limitedPatrons.rows[idx].name));
      });

      it('it should return a limit of no patrons', async () => {
        limit = offset = 0;
        let { rows: noPatrons } = await patronService.readCheckedOut({ offset, limit });
        expect(noPatrons).to.be.empty;
      });
    });

    describe('offset', async () => {
      it('it should return a limit of one patron with an offset greater than zero', async () => {
        offset = limit = 1;
        const [ { name: secondPatron } ] = allCheckedOutPatrons?.slice(offset,limit+1);
        const { rows: [ {name: limitedSecondPatron} ] } = await patronService.readCheckedOut({ offset, limit });
        expect(secondPatron).to.equal(limitedSecondPatron);
      });

      it('it should return a limit of some patrons with an offset greater than zero', async () => {
        limit = Math.ceil(allCheckedOutPatrons.length/2);
        const somePatrons = allCheckedOutPatrons?.slice(limit+1);
        limitedPatrons = await patronService.readCheckedOut({ offset, limit });
        somePatrons.forEach((patron, idx) => expect(patron.name === limitedPatrons.rows[idx].name));
      });

      it('it should return a limit of no patrons with an offset ...', async () => {
        limit = 0, offset = 1;
        let { rows: noPatrons } = await patronService.readCheckedOut({ offset, limit });
        expect(noPatrons).to.be.empty;
      });
    });
  });
});

