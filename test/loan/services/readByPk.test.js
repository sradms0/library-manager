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


describe('services.loan.readByPk', async () => {
  const loanData = testOps.Data.loanData();
  let id;

  before('reload', async () => {
    await testOps.Data.loadTestDb('book', 'patron');
    ({ id }  = (await loanService.create( await loanData({ set: {'book_id': 1} }) )));
  })

  it('it should return a Promise', async () => {
    expect(loanService.readByPk(id) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to a Loan instance', async () => {
    expect((await loanService.readByPk(id)) instanceof loanService.model).to.be.true;
  });

  it('it should return expected loan from the specified primary key', async () => {
    const expectedLoan = JSON.stringify(await loanService.model.findOne(
                          { where: {id}, include:[bookService.model, patronService.model] }
    )),
          receivedLoan = JSON.stringify(await loanService.readByPk(id));
    expect(receivedLoan).to.equal(expectedLoan);
  });

  it('it should return a loan from the database with an association its book data', async () => {
    const loan = await loanService.readByPk(id);
    const { Book: book } = loan;
    const { id: bookId } = book;

    const associatedBook = JSON.stringify(await bookService.model.findByPk(bookId));
    expect(associatedBook).to.equal(JSON.stringify(book));
  });

  it('it should return a loan from the database with an association its patron data', async () => {
    const loan = await loanService.readByPk(id);
    const { Patron: patron } = loan;
    const { id: patronId } = patron;

    const associatedPatron = JSON.stringify(await patronService.readByPk(patronId));
    expect(associatedPatron).to.equal(JSON.stringify(patron));
  });

  it('it should return null when finding a non-existent loan primary key', async () => {
    expect(await loanService.readByPk(-1)).to.be.null;
  });
});


