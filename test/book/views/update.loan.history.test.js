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

describe('views.book.update.loan.history', async () => {
  const browser = new Browser();

  let requester,
      bookId = 1,
      patronIdStart = 1;

  before('add loans', async () => {
    requester = await chai.request(server).keepOpen(),
    await testOps.Data.loadTestDb('book');

    const total = 10;
    await testOps.Data.addPatrons(patronService.create, total)
    await testOps.Data.addLoansToBook(loanService.create, bookId, patronIdStart, total);

    await testOps.Route.visitOneBook(browser, bookId);
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

    const { Loans } = await bookService.readByPk(bookId),
          dateToStr = date => date.toLocaleDateString('en-CA', { timeZone: 'UTC' });

    Loans.forEach((loan, idx)=> {
      const { Book, Patron } = loan,
            loanTxt = tdTxt[idx];

      expect(
        loanTxt.tdBook === Book.title &&
        loanTxt.tdPatron === Patron.name &&
        dateToStr(loan.loaned_on) === loanTxt.tdLoanedOn &&
        dateToStr(loan.return_by) === loanTxt.tdReturnBy && (
          loan.returned_on ? 
            loan.returned_on.toLocaleDataString('en-CA') === loanTxt.tdReturnedOn :
            true
        )
      ).to.be.true;
    })
  });
})
