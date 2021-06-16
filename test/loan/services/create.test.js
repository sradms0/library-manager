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


chai.use(require('chai-as-promised'));


describe('services.loan.create', () => {
  const _loanData = testOps.Data.loanData();

  before('reload', async () => {
    await testOps.loadTestDb('book', 'patron');
    await testOps.Data.addBooks(bookService.create, 20);
    await testOps.Data.addPatrons(patronService.create, 20);
  });

  it('it should return a promise', () => {
    const loanData = _loanData();
    expect(loanService.create(loanData) instanceof Promise).to.be.true;
  });

  it('it should create one loan', async () => {
    const loanData = await _loanData();

    const createdLoan = (await loanService.create(loanData))?.toJSON(),
          { book_id, patron_id } = createdLoan;

    const { count, rows } = await loanService.model.findAndCountAll({ where: {book_id, patron_id} }),
          loanFound = rows?.[0]?.toJSON();

    const wasCreated = testOps.Data.getModelAttrs(loanService.model)
                        .every(prop => ''+createdLoan?.[prop] === ''+loanFound?.[prop]);
    expect(count === 1 && wasCreated).to.be.true;
  });

  describe('error validation', () => {
    const pause = true;

    it('it should throw an error when an empty loaned_on date is given', async () => {
      await expect(loanService.create(await _loanData({ set: {'loaned_on': ''}, pause })))
        .to.be.rejectedWith('"Loaned On" is required');
    });

    it('it should throw an error when a future loaned_on date is given', async () => {
      const future = testOps.Data.getFutureOrPastDate(new Date(), 1);
      await expect(loanService.create(await _loanData({ set: {'loaned_on': future}, pause })))
        .to.be.rejectedWith('"Loaned On" exceeds current date');
    });

    it('it should not throw an error when a loaned_on date of today is given', async () => {
      const today = new Date();
      await expect(loanService.create(await _loanData({ set: {'loaned_on': today}, pause })))
        .to.not.be.rejectedWith('"Loaned On" exceeds current date');
    });

    it('it should not throw an error when a loaned_on date before today is given', async () => {
      const yesterday = testOps.Data.getFutureOrPastDate(new Date(), -1);
      await expect(loanService.create(await _loanData({ set: {'loaned_on': yesterday}, pause })))
        .to.not.be.rejectedWith('"Loaned On" exceeds current date');
    });

    it('it should throw an error when an invalid loaned_on date is given', async () => {
      await expect(loanService.create(await _loanData({ set: {'loaned_on': 'abc'}, pause })))
        .to.be.rejectedWith('Valid "Loaned On" date is required');
    });

    it('it should throw an error when a loaned_on property doesn\'t exist', async () => {
      await expect(loanService.create(await _loanData({ del: ['loaned_on'] })))
        .to.be.rejectedWith('"Loaned On" field is required');
    });

    it('it should throw an error when an empty return_by date is given', async () => {
      await expect(loanService.create(await _loanData({ set: {'return_by': ''}, pause })))
        .to.be.rejectedWith('"Return By" is required');
    });

    it('it should throw an error when a return_by date before a loaned_on data is given', async () => {
      const past = testOps.Data.getFutureOrPastDate(new Date(), -1);
      await expect(loanService.create(await _loanData({ set: {'return_by': past}, pause })))
        .to.be.rejectedWith('"Return By" subceeds "Loaned On" date');
    });

    it('it should throw an error when an invalid return_by date is given', async () => {
      await expect(loanService.create(await _loanData({ set: {'return_by': 'abc'}, pause })))
        .to.be.rejectedWith('Valid "Return By" date is required');
    });

    it('it should throw an error when a return_by property doesn\'t exist', async () => {
      await expect(loanService.create(await _loanData({ del: ['return_by'] })))
        .to.be.rejectedWith('"Return By" field is required');
    });

    it('it should throw an error when a returned_on date before a loaned_on data is given', async () => {
      const past = testOps.Data.getFutureOrPastDate(new Date(), -1);
      await expect(loanService.create(await _loanData({ set: {'returned_on': past}, pause })))
        .to.be.rejectedWith('"Returned On" subceeds "Loaned On" date');
    });

    it('it should throw an error when an invalid returned_on date is given', async () => {
      await expect(loanService.create(await _loanData({ set: {'returned_on': 'abc'}, pause })))
        .to.be.rejectedWith('Valid "Returned On" date is required');
    });

    it('it should throw an error when an empty book_id is given', async () => {
      await expect(loanService.create(await _loanData({ set: {'book_id': ''} })))
        .to.be.rejectedWith('"Book" is required');
    });

    it('it should throw an error when a book_id doesn\'t exist', async () => {
      await expect(loanService.create(await _loanData({ del: ['book_id'] })))
        .to.be.rejectedWith('"Book" field is required');
    });

    it('it should throw an error when an empty patron_id is given', async () => {
      await expect(loanService.create(await _loanData({ set: {'patron_id': ''} })))
        .to.be.rejectedWith('"Patron" is required');
    });

    it('it should throw an error when a patron_id doesn\'t exist', async () => {
      await expect(loanService.create(await _loanData({ del: ['patron_id'] })))
        .to.be.rejectedWith('"Patron" field is required');
    });

    it('it should throw an error when all empty fields are given', async () => {
      await expect(loanService.create(await _loanData({ set: {'all': ''} }))).to.be.rejectedWith(
        'Validation error: "Loaned On" is required,\n'+
        'Validation error: Valid "Loaned On" date is required,\n'+
        'Validation error: "Return By" is required,\n'+
        'Validation error: Valid "Return By" date is required,\n'+
        'Validation error: Valid "Returned On" date is required,\n'+
        'Validation error: "Book" is required,\n'+
        'Validation error: "Patron" is required'
      );
    });

    it('it should throw an error when all properties don\'t exist', async () => {
      await expect(loanService.create(await _loanData({ del: 'all' }))).to.be.rejectedWith(
        'notNull Violation: "Loaned On" field is required,\n'+
        'notNull Violation: "Return By" field is required,\n'+
        'notNull Violation: "Book" field is required,\n'+
        'notNull Violation: "Patron" field is required'
      );
    });
  });
});

