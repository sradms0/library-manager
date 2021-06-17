'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { 
  book: bookService,
  loan: loanService,
  patron: patronService 
} = require('$services');
const { loader } = require('$seed/loans');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

chai.use(require('chai-as-promised'));


describe('services.loan.update', () => {
  const loanData = testOps.Data.loanData();

  before('reload', async () => {
    await testOps.loadTestDb();
  });

  it('it should return a promise', async () => {
    const loan = await loanService.readByPk(1), { book_id } = loan;
    const updatedLoanData = await loanData();
    expect(loanService.update(loan, updatedLoanData) instanceof Promise).to.be.true;
  });

  it('it should update one loan', async () => {
    const loan = await loanService.readByPk(1), { book_id } = loan;
    const updatedLoanData = await loanData(
      { bookRead: bookService.readByPk, patronRead: patronService.readByPk }, 
      { set: {'id': loan.id} }
    );

    const updated = (await loanService.update(loan, updatedLoanData)).toJSON();
    const wasUpdated = Object.keys(updatedLoanData).forEach(key => 
      expect(JSON.stringify(updated[key])).to.equal(JSON.stringify(updatedLoanData[key]))
    );
  });

  describe('error validation', () => {
    const { messages: valMsgs} = testOps.Data.getModelValidationErrorMessages('loan');
    let errLoan;

    beforeEach('', async () => {
      await testOps.loadTestDb();
      const loanData = testOps.Data.loanData();
      errLoan = await loanService.create(await loanData());
    });

    it('it should throw an error when an empty loaned_on date is given', async () => {
      await expect(
        loanService.update(errLoan, { loaned_on: '' })
      ).to.be.rejectedWith(valMsgs.loaned_on.notEmpty);
    });

    it('it should throw an error when a future loaned_on date is given', async () => {
      const future = testOps.Data.getFutureOrPastDate(new Date(), 1);
      await expect(loanService.update(errLoan, { loaned_on: future }))
        .to.be.rejectedWith(valMsgs.loaned_on.requiredDate);
    });

    it('it should throw an error when an invalid loaned_on date is given', async () => {
      await expect(loanService.update(errLoan, { loaned_on: 'abc' }))
        .to.be.rejectedWith(valMsgs.loaned_on.isDate);
    });

    it('it should throw an error when an empty return_by date is given', async () => {
      await expect(loanService.update(errLoan, { return_by: '' }))
        .to.be.rejectedWith(valMsgs.return_by.notEmpty);
    });

    it('it should throw an error when a return_by date before a loaned_on date is given', async () => {
      const past = testOps.Data.getFutureOrPastDate(new Date(), -1);
      await expect(loanService.update(errLoan, { return_by: past }))
        .to.be.rejectedWith(valMsgs.return_by.requiredDate);
    });

    it('it should throw an error when an invalid return_by date is given', async () => {
      await expect(loanService.update(errLoan, {return_by: 'abc'}))
        .to.be.rejectedWith(valMsgs.return_by.isDate);
    });

    it('it should throw an error when a returned_on date before a loaned_on date is given', async () => {
      const past = testOps.Data.getFutureOrPastDate(new Date(), -1);
      await expect(loanService.update(errLoan, { returned_on: past }))
        .to.be.rejectedWith(valMsgs.returned_on.requiredDate);
    });

    it('it should throw an error when an invalid returned_on date is given', async () => {
      await expect(loanService.update(errLoan, { returned_on: 'abc' }))
        .to.be.rejectedWith(valMsgs.returned_on.isDate);
    });

    it('it should throw an error when an empty book_id is given', async () => {
      await expect(loanService.update(errLoan, { book_id: '' }))
        .to.be.rejectedWith(valMsgs.book.notEmpty);
    });

    it('it should throw an error when an empty patron_id is given', async () => {
      await expect(loanService.update(errLoan, { patron_id: '' }))
        .to.be.rejectedWith(valMsgs.patron.notEmpty);
    });

    it('it should not throw a date assertion error when a loaned_on date and empty returned_on date are given', async () => {
      await expect(loanService.update(errLoan, { returned_on: ''}))
        .to.not.be.rejectedWith(valMsgs.returned_on.requiredDate);
    });

    it('it should not throw a date assertion error when a loaned_on date and empty return_by date are given', async () => {
      await expect(loanService.update(errLoan, {returned_by: ''}))
        .to.not.be.rejectedWith(valMsgs.return_by.requiredDate);
    });

    it('it should throw an error when all empty fields are given', async () => {
      const allEmptyValMsgs = testOps.Validation
        .getValMsgs(valMsgs, { sansNestedKeys: ['notNull', 'requiredDate'] })
        .reduce((acc, curr) => acc+`Validation error: ${curr},\n`, '')
        .slice(0,-2)
        await expect(loanService.update(errLoan, await testOps.Data.loanData()({ set: {'all': ''} })))
          .to.be.rejectedWith(allEmptyValMsgs);
    });
  })
});

