'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/loans');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { loan: loanController } = require('$controllers');
const { 
  book: bookService,
  loan: loanService,
  patron: patronService 
} = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res');


chai.use(require('sinon-chai'));


describe('controllers.loan.create', () => {
  const { Data } = testOps,
        emptyLoan = async () => ({ id: null, ...(await Data.emptyLoan()) }),
        loanData = Data.loanData();

  before('reload', async () => {
    await testOps.Data.loadTestDb();
  });

  it('it should create one loan when all required attributes are given', async () => {
    const id = 100,
          res = mockResponse(),
          req = mockRequest({ body: (await loanData({ set: {id} })) });
    await loanController.create(req, res);
    expect(await loanService.readByPk(id)).to.not.be.null;
  });

  it('it should redirect the user to /loans after a loan is created', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: (await loanData()) });
    await loanController.create(req, res);
    expect(res.redirect).to.have.been.calledWith('/loans');
  });

  describe('validation errors', () => {
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('loan'),
          { withoutVal, getValMsgs } = testOps.Validation,
          { addPostErrDataToLoan } = testOps.Data;

    const oneBookReader = bookService.readByPk,
          onePatronReader = patronService.readByPk 

    const allReaders = { 
            allBooksReader: bookService.readAll, 
            allPatronsReader: patronService.readAll 
          },
          singleReaders = {
            oneBookReader,
            onePatronReader
          };

    it('it should call res.render with prev. data when only a loaned_on date is given (from validation error)', async () => {
      const loan = { ...(await emptyLoan()), loaned_on: new Date() },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['loaned_on'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: loan });

      await loanController.create(req, res);
      await addPostErrDataToLoan(loan, allReaders);
      expect(res.render).to.have.been.calledWith('loan/new', { dataValues: loan, errors });
    });

    it('it should call res.render with prev. data when only a return_by date is given (from validation error)', async () => {
      const loan = { ...(await emptyLoan()), return_by: new Date() },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['return_by'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: loan });

      await loanController.create(req, res);
      await addPostErrDataToLoan(loan, allReaders);
      expect(res.render).to.have.been.calledWith('loan/new', { dataValues: loan, errors });
    });

    it('it should call res.render with prev. data when only a returned_on date is given (from validation error)', async () => {
      const loan = { ...(await emptyLoan()), returned_on: new Date() },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['returned_on'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: loan });

      await loanController.create(req, res);
      await addPostErrDataToLoan(loan, allReaders);
      expect(res.render).to.have.been.calledWith('loan/new', { dataValues: loan, errors });
    });

    it('it should call res.render with prev. data when only a book is given (from validation error)', async () => {
      const loan = { ...(await emptyLoan()), book_id: 1 },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['book'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: loan });
      await loanController.create(req, res);
      await addPostErrDataToLoan(loan, allReaders, { book: true }, { oneBookReader });
      expect(res.render).to.have.been.calledWith('loan/new', { dataValues: loan, errors });
    });

    it('it should call res.render with prev. data when only a patron is given (from validation error)', async () => {
      const loan = { ...(await emptyLoan()), patron_id: 1 },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['patron'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: loan });

      await loanController.create(req, res);
      await addPostErrDataToLoan(loan, allReaders, { patron: true }, { onePatronReader });
      expect(res.render).to.have.been.calledWith('loan/new', { dataValues: loan, errors });
    });

    it('it should call res.render with no prev. data when only all required fields are empty (from validation error)', async () => {
      const loan = await emptyLoan(),
            errors = getValMsgs(valMsgs, { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: loan });

      await loanController.create(req, res);
      await addPostErrDataToLoan(loan, allReaders);
      expect(res.render).to.have.been.calledWith('loan/new', { dataValues: loan, errors });
    });
  });
});
