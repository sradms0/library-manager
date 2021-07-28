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


describe('views.loan.index.search', () => {
  const modelAttrs = testOps.Data.getModelAttrs(loanService.model, { without: [
    'book_id',
    'id', 
    'createdAt', 
    'patron_id',
    'updatedAt'
  ]}); modelAttrs.unshift('Book', 'Patron');

  const browser = new Browser();
  let requester;

  let form, searchI;

  const dateToStr = date => date.toLocaleDateString('en-CA', { timeZone: 'UTC' });

  const loanTrToStr = loanTr => {
    return [...loanTr.childNodes]
      .slice(0,5)
      .reduce((acc, {textContent: curr}) => acc+curr+' ', '');
  }

  const loanDatToStr = loanDat => {
    const { 
      Book: {title}, 
      Patron: {name},
      loaned_on,
      return_by,
      returned_on
    } = loanDat;

    return Object.values({
        title,
        name,
        loanedOn: dateToStr(loaned_on),
        returnBy: dateToStr(return_by),
        returnedOn: returned_on ? dateToStr(returned_on): ''
      }).reduce((acc, curr) => acc+curr+' ', '');
  }

  const setSearchElements = () => {
    form = browser.querySelector('form');
    searchI = browser.querySelector('input#loan-q');
  } 

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  beforeEach('run server', async() => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitLoans(browser);
    setSearchElements();
  });

  afterEach('close server', () => {
    requester.close();
  });

  describe('search-form', () => {
    it('it should have a form for finding loans', () => {
      expect(form).to.not.be.null;
    });

    it('it should have a form with a get method', () => {
      expect(form?.method).to.equal('get');
    });

    it('it should have a form with an action of /loans/search', () => {
      const [ action ] =  form?.action?.match(/\/loans\/search$/g);
      expect(action).to.equal('/loans/search');
    });

    it('it should have a form with input for loan-searching', () => {
      expect(searchI).to.not.be.null;
    });

    it('it should have a search-form with a button for submitting a search', () => {
      const submitI = form?.querySelector('input[type="submit"]');
      expect(submitI).to.not.be.undefined;
    });

    it('it should set a default page and limit after after submitting a search', async () => {
      const { rows: [{ loaned_on: firstLoanedOnDate }] } = await loanService.readAll();
      testOps.LoanForm.fillSearch(browser, dateToStr(firstLoanedOnDate));
      form?.submit();
      await browser.wait();
      const [ url ] = browser.location._url.match(/\/loans\/search\?q=.+&page=1&limit=10$/g);
      expect(url).to.not.be.null;
    });
  });

  describe('one loan result', () => {
    const searchOneAndFound = async (browser, form, loan, attr) => {
      const currLoanAttrVal = loan[attr];

      let searchAttrVal = currLoanAttrVal;
      if (currLoanAttrVal instanceof Date)
        searchAttrVal = dateToStr(currLoanAttrVal);
      else if (attr === 'Book')
        searchAttrVal = currLoanAttrVal.title;
      else if (attr === 'Patron')
        searchAttrVal = currLoanAttrVal.name;


      testOps.LoanForm.fillSearch(browser, searchAttrVal);
      form?.submit();
      await browser.wait();

      const loanTrs = testOps.DOM.fetchTrs(browser),
            loanTrStr  = loanTrToStr(loanTrs[0]),
            loanDatStr = loanDatToStr(loan);

      return loanTrs.length === 1 && loanTrStr === loanDatStr;
    }

    let oneLoan;
    before('make one unique loan outside of normal date range (use 2wk range)', async () => {
      await testOps.Data.loadTestDb();
      ({ rows: [oneLoan] } = await loanService.readAll());
      if (oneLoan) {
        const lastWeek = testOps.Data.getFutureOrPastDate(new Date(), -14),
              today = new Date(),
              twoWeeksFromLastWeek = testOps.Data.getFutureOrPastDate(lastWeek, 14);

        await loanService.update(oneLoan, { 
          loaned_on: lastWeek, 
          return_by: twoWeeksFromLastWeek,
          returned_on: today
        }); oneLoan = await loanService.readByPk(oneLoan.id);
      }
    });

    modelAttrs.forEach((attr, idx) => {
      it(`it should show one ${attr}-searched loan`, async () => {
        const res = await searchOneAndFound(browser, form, oneLoan, attr);
        expect(res).to.be.true;
      });
    });
  });

  describe('many loan results', async () => {
    const searchManyAndFound = async (browser, form, loans, attrVal) => {
      const searchAttrVal = attrVal instanceof Date ?  dateToStr(attrVal) : attrVal;

      testOps.LoanForm.fillSearch(browser, searchAttrVal);
      form?.submit();
      await browser.wait();

      const loanTrs = [...testOps.DOM.fetchTrs(browser)];
      let loanTrsDatStr = '',
          loansDatStr = '';

      loanTrs.forEach((tr, idx) => {
        loanTrsDatStr += loanTrToStr(tr)+'\n',
        loansDatStr += loanDatToStr(loans[idx])+'\n';
      });

      return loanTrsDatStr === loansDatStr;
    }

    const yesterday = testOps.Data.getFutureOrPastDate(new Date(), -1),
          today = new Date(),
          nextWeek = testOps.Data.getFutureOrPastDate(yesterday, 7),
          nonUniqueLoanData = { 
            loaned_on: yesterday, 
            return_by: nextWeek, 
            returned_on: today
          },
          nonUniqueBookData = {
            title: 'title'
          },
          nonUniquePatronData = {
            first_name: 'first',
            last_name: 'last'
          },
          manyLoans = [];

    let nonUniqueData;

    before('create loans of identical attrs. with books and patrons', async () => {
      await testOps.Data.loadTestDb(null);

      const bookData = testOps.Data.bookData(),
            patronData = testOps.Data.patronData(),
            loanData = testOps.Data.loanData(),
            totalSimilar = 5;

      for (let i = 0; i < totalSimilar; i++) {
        await bookService.create({ ...bookData({ set: {...nonUniqueBookData} }) });
        await patronService.create({ ...patronData({ set: {...nonUniquePatronData} }) });
        const { id } = await loanService.create( await loanData({ set: {...nonUniqueLoanData} }) );
        manyLoans.push( await loanService.readByPk(id) );
      }

      const { title } = nonUniqueBookData,
            { first_name, last_name } = nonUniquePatronData,
            name = `${first_name} ${last_name}`;

      nonUniqueData = { Book: title, Patron: name, ...nonUniqueLoanData };
    });

    modelAttrs.forEach(attr => {
      it(`it should show many ${attr}-searched loans`, async () => {
        const res = await searchManyAndFound(browser, form, manyLoans, nonUniqueData[attr]);
        expect(res).to.be.true;
      });
    });
  });

  describe('no searched-loan results', async () => {
    it('it should find no loans', async () => {
      testOps.LoanForm.fillSearch(browser, 'DOES NOT EXIST');
      form?.submit();
      await browser.wait();

      const loanTrs = testOps.DOM.fetchTrs(browser);
      expect(loanTrs).to.be.empty;
    });
  });
});
