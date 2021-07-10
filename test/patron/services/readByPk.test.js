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


describe('services.patron.readByPk', async () => {
  let id, associatedLoans;

  before('reload', async () => {
    await testOps.Data.loadTestDb();

    ({ id } = (await patronService.model.findAll({ 
      include: { 
        model: loanService.model,
        include: [bookService.model, patronService.model]
      }})).filter(({Loans}) => Loans.length)[0]);

    associatedLoans = await loanService.model.findAll({ 
      where: {patron_id: id}, include: [bookService.model, patronService.model],
    });
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

  it('it should include loans associated with a patron', async () => {
    const { Loans: nestedLoans } = await patronService.readByPk(id);
    associatedLoans.forEach(({ id: loanId }, idx) => 
      expect(nestedLoans[idx].id).to.equal(loanId)
    );
  });

  it('it should include associated loans with nested associated books', async () => {
    const { Loans: nestedLoans } = await patronService.readByPk(id);
    associatedLoans.forEach(({ Book: {id: bookId} }, idx) => 
      expect(nestedLoans[idx].Book.id).to.equal(bookId)
    );
  });

  it('it should include associated loans with the nested associated patron', async () => {
    const { Loans: nestedLoans } = await patronService.readByPk(id);
    associatedLoans.forEach(({ Patron: {id: patronId} }, idx) => 
      expect(nestedLoans[idx].Patron.id).to.equal(patronId)
    );
  });
});

