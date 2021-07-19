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


describe('controllers.loan.return', () => {
  const postData = { returned_on: new Date() };
  let loan, 
      id, 
      loaned_on,
      return_by,
      createdAt,
      updatedAt,
      book_id, 
      patron_id;

  beforeEach('start server', async () => {
    await testOps.Data.loadTestDb();
    const { id: _ } = await loanService.model.findOne({ where: {returned_on: null} });
    loan = await loanService.readByPk(_),
    { id, loaned_on, return_by, createdAt, updatedAt, book_id, patron_id } = loan;
  });

  it('it should throw an error when a non-existent loan return is attempted', async() => {
    const res = mockResponse(),
          badId = -1,
          req = mockRequest({ params: {id: badId} });

    expect(await loanController.return(req, res, err => err.message))
      .to.equal(`Loan with id ${badId} does not exist`);
  });

  it('it should throw an error when a loan has already been returned', async () => {
    const toReturn = await loanService.model.findOne({ where: {returned_on: null} });
    await loanService.update(toReturn, { returned_on: new Date() });
    const { id: returnedId } = toReturn;

    const res = mockResponse(),
          req = mockRequest({ params: {id: returnedId} }),
          { returned_on } = await loanService.readByPk(returnedId);
    expect(await loanController.return(req, res, err => err.message))
      .to.equal(`Loan with id ${returnedId} has been returned on ${returned_on}`);
  });

  it('it should return the loan when a return_by date is given', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: postData , params: {id} });
    await loanController.return(req, res);
    expect((await loanService.readByPk(id)).returned_on).to.eql(postData.returned_on);
  });

  it('it should redirect the user to /loans/all after a loan is returned', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: postData, params: {id} });
    await loanController.return(req, res);
    expect(res.redirect).to.have.been.calledWith('/loans/all');
  });

  describe('validation errors', () => {
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('loan'),
          { Validation: { getValMsgs, withoutVal } } = testOps,
          sansValProps = { props: ['book', 'patron', 'loaned_on', 'return_by'] },
          
          copyFirstLevelLoanProps = ({ returned_on }) => ({
            id, 
            loaned_on,
            return_by,
            returned_on,
            createdAt,
            updatedAt,
            book_id,
            patron_id
          }),

          addExpectedPostDataFromErrorHandler = async preCopy => { 
            const { book_id, patron_id } = preCopy;
            preCopy.Book = await bookService.readByPk(book_id);
            preCopy.Patron = await patronService.readByPk(patron_id);
          };

    it('it should call res.render with prev. data when an empty return_on date is given for returning a loan', async () => {
      const empty = copyFirstLevelLoanProps({ returned_on: '' }),
            errors = getValMsgs(withoutVal(valMsgs, sansValProps), { sansNestedKeys: ['notNull', 'requiredDate'] }),
            res = mockResponse(),
            req = mockRequest({ body: empty, params: {id} });
      await loanController.return(req, res);
      await addExpectedPostDataFromErrorHandler(empty);
      expect(res.render).to.have.been.calledWith('loan/return', { dataValues: empty, errors });
    });

    it('it should call res.render with prev. data when an invalid return_on date is given for returning a loan', async () => {
      const invalid = copyFirstLevelLoanProps({ returned_on: 'abc' }),
            errors = getValMsgs(withoutVal(valMsgs, sansValProps), { sansNestedKeys: ['notNull', 'notEmpty', 'requiredDate'] }),
            res = mockResponse(),
            req = mockRequest({ body: invalid, params: {id} });
      await loanController.return(req, res);
      await addExpectedPostDataFromErrorHandler(invalid);
      expect(res.render).to.have.been.calledWith('loan/return', { dataValues: invalid, errors });
    });

    it('it should call res.render with pre. data when a returned_on date before a loaned_on date is given for returning a loan', async () => {
      const yesterday = testOps.Data.getFutureOrPastDate(loan.loaned_on, -1),
            past = copyFirstLevelLoanProps({ returned_on: yesterday }),
            errors = getValMsgs(withoutVal(valMsgs, sansValProps), { sansNestedKeys: ['notNull', 'notEmpty', 'isDate'] }),
            res = mockResponse(),
            req = mockRequest({ body: past, params: {id} });
      await loanController.return(req, res);
      await addExpectedPostDataFromErrorHandler(past);
      expect(res.render).to.have.been.calledWith('loan/return', { dataValues: past, errors });
    });
  });
});
