'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { 
  book: bookService,
  loan: loanService, 
  patron: patronService 
} = require('$services');

const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.book.readByPk', async () => {
  let id, associatedLoans;

  before('reload', async () => {
    await testOps.Data.loadTestDb();

    ({ id } = (await bookService.model.findAll({ 
      include: { 
        model: loanService.model,
        include: { model: patronService.model }
      }})).filter(({Loans}) => Loans.length)[0]);

    associatedLoans = await loanService.model.findAll({ 
      where: {book_id: id}, include: [bookService.model, patronService.model],
    });
  });

  it('it should return a Promise', async () => {
    expect(bookService.readByPk(id) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to a Book instance', async () => {
    expect((await bookService.readByPk(id)) instanceof bookService.model).to.be.true;
  });

  it('it should return null when finding a non-existent book primary key', async () => {
    expect(await bookService.readByPk(-1)).to.be.null;
  });

  it('it should include loans associated with a book', async () => {
    const { Loans: nestedLoans } = await bookService.readByPk(id);
    associatedLoans.forEach(({ id: loanId }, idx) => 
      expect(nestedLoans[idx].id).to.equal(loanId)
    );
  });

  it('it should include associated loans with nested associated patrons', async () => {
    const { Loans: nestedLoans } = await bookService.readByPk(id);
    associatedLoans.forEach(({ Patron: {id: patronId} }, idx) => 
      expect(nestedLoans[idx].Patron.id).to.equal(patronId)
    );
  });

  it('it should include associated loans with the nested associated book', async () => {
    const { Loans: nestedLoans } = await bookService.readByPk(id);
    associatedLoans.forEach(({ Book: {id: bookId} }, idx) => 
      expect(nestedLoans[idx].Book.id).to.equal(bookId)
    );
  });
});

