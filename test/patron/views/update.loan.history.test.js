'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { 
  book: bookService, 
  loan: loanService,
  patron: patronService 
} = require('$services');


chai.use(require('chai-http'));

describe('views.patron.update.loan.history', async () => {
  const browser = new Browser();

  let requester,
      patronId = 1,
      bookIdStart = 1;

  before('add loans', async () => {
    requester = await chai.request(server).keepOpen(),
    await testOps.Data.loadTestDb('patron');

    const total = 10;
    await testOps.Data.addBooks(bookService.create, total)
    await testOps.Data.addLoansToPatron(loanService.create, patronId, bookIdStart, total);

    await testOps.Route.visitOnePatron(browser, patronId);
  });

  after('close', () => {
    requester.close();
  });

  it('it should display its loan-history', async () => {
    const tdTxt = [...testOps.DOM.fetchTrs(browser)].map(tr => {
      const { 
        children: [ 
          {textContent: tdBook}, 
          {textContent: tdPatron}, 
          {textContent: tdLoanedOn},
          {textContent: tdReturnBy},
          {textContent: tdReturnedOn}
        ]
      } = tr;

      return { 
        tdBook, 
        tdPatron, 
        tdLoanedOn, 
        tdReturnBy, 
        tdReturnedOn 
      };
    });

    const { Loans } = await patronService.readByPk(patronId);
    Loans.forEach((loan, idx)=> {
      const { Book, Patron } = loan,
            loanTxt = tdTxt[idx];

      expect(
        loanTxt.tdBook === Book.title &&
        loanTxt.tdPatron === Patron.name &&
        loan.loaned_on.toLocaleDateString('en-CA') === loanTxt.tdLoanedOn &&
        loan.return_by.toLocaleDateString('en-CA') === loanTxt.tdReturnBy && (
          loan.returned_on ? 
            loan.returned_on.toLocaleDataString('en-CA') === loanTxt.tdReturnedOn :
            true
        )
      ).to.be.true;
    });
  });
});
