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


describe('controllers.loan.update', () => {
  const { Data } = testOps,
        { emptyLoan } = Data,
        loanData = Data.loanData();

  let updated, 
      id,
      loaned_on,
      returned_on,
      return_by,
      book_id,
      patron_id;

  beforeEach('reload', async () => {
    await testOps.loadTestDb();
    id = 1;
    const toUpdate = await loanService.readByPk(1);
    ({ book_id, patron_id } = toUpdate);

    updated = await testOps.Data.loanData()({ 
      set: { book_id: book_id+1, patron_id: patron_id+1 },
      bookRead: bookService.readByPk, patronRead: patronService.readByPk
    });
    ({ loaned_on, returned_on, return_by, book_id, patron_id } = updated);
  });

  it('it should throw an error when a non-existent loan update is attempted', async() => {
    const res = mockResponse(),
          badId = -1,
          req = mockRequest({ params: {id: badId} });

    expect(await loanController.update(req, res, err => err.message))
      .to.equal(`Loan with id ${badId} does not exist`);
  });

  it('it should update one loan when all attributes are given', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: updated, params: {id} });

    await loanController.update(req, res);
    const updatedLoan = (await loanService.readByPk(id))?.toJSON();
    Object.keys(updated).forEach(key => 
      expect(JSON.stringify(updatedLoan[key])).to.equal(JSON.stringify(updated[key]))
    );
  });

  it('it should redirect the user to /loans after a loan is updated', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: updated, params: {id} });
    await loanController.update(req, res);
    expect(res.redirect).to.have.been.calledWith('/loans');
  });

  describe('validation errors', () => {
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('loan'),
          { withoutVal, getValMsgs } = testOps.Validation;

    it('it should call res.render with prev. data when only a loaned_on date is given (from validation error)', async () => {
      const updatedCopy = { id, ...(await emptyLoan()), loaned_on },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['loaned_on'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await loanController.update(req, res);
      expect(res.render).to.have.been.calledWith('loan/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only a return_by date is given (from validation error)', async () => {
      const updatedCopy = { id, ...(await emptyLoan()), return_by },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['return_by'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await loanController.update(req, res);
      expect(res.render).to.have.been.calledWith('loan/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only a returned_on date is given (from validation error)', async () => {
      const updatedCopy = { id, ...(await emptyLoan()), returned_on },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['returned_on'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await loanController.update(req, res);
      expect(res.render).to.have.been.calledWith('loan/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only a book is given (from validation error)', async () => {
      const updatedCopy = { id, ...(await emptyLoan()), book_id },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['book'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await loanController.update(req, res);
      expect(res.render).to.have.been.calledWith('loan/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only a patron is given (from validation error)', async () => {
      const updatedCopy = { id, ...(await emptyLoan()), patron_id },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['patron'] }), 
                      { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await loanController.update(req, res);
      expect(res.render).to.have.been.calledWith('loan/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with no prev. data when only all required fields are empty (from validation error)', async () => {
      const updatedCopy = { id, ...(await emptyLoan()) },
            errors = getValMsgs(valMsgs, { sansNestedKeys: ['notNull', 'requiredDate'], sorted: true }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await loanController.update(req, res);
      expect(res.render).to.have.been.calledWith('loan/update', { dataValues: updatedCopy, errors });
    });
  });
});