'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/patrons');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { patron: patronController } = require('$controllers');
const { patron: patronService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res');


chai.use(require('sinon-chai'));


describe('controllers.patron.update', () => {
  const { Data } = testOps,
        { emptyPatron } = Data,
        patronData = Data.patronData();

  let updated, id;

  beforeEach('reload', async () => {
    await testOps.loadTestDb('patron');
    id = 1;
    updated = testOps.Data.patronData()({ prop: 'id', val: id });
  });

  it('it should throw an error when a non-existent patron update is attempted', async() => {
    const res = mockResponse(),
          badId = -1,
          req = mockRequest({ params: {id: badId} }),
          patron = await patronService.readByPk(id);

    expect(await patronController.update(req, res, err => err.message))
      .to.equal(`Patron with id ${badId} does not exist`);
  });

  it('it should update one patron when all attributes are given', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: updated, params: {id} });

    await patronController.update(req, res);
    const updatedPatron = (await patronService.readByPk(id))?.toJSON();
    Object.keys(updated).forEach(key => 
      expect(updated[key]+'').to.equal(updatedPatron[key]+'')
    );
  });

  it('it should redirect the user to /patrons after a patron is updated', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: updated, params: {id} });
    await patronController.update(req, res);
    expect(res.redirect).to.have.been.calledWith('/patrons');
  })

  describe('validation errors', () => {
    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('patron'),
          { withoutVal, getValMsgs } = testOps.Validation;

    it('it should call res.render with prev. data when only a first_name is given (from validation error)', async () => {
      const updatedCopy = { id, ...emptyPatron(), first_name: 'firstname' },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['first_name'] }), { sansNestedKeys: ['notNull', 'unique'] }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only a last_name is given (from validation error)', async () => {
      const updatedCopy = { id, ...emptyPatron(), last_name: 'lastname' },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['last_name'] }), { sansNestedKeys: ['notNull', 'unique'] }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only an address is given (from validation error)', async () => {
      const updatedCopy = { id, ...emptyPatron(), address: '123 road' },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['address'] }), { sansNestedKeys: ['notNull', 'unique'] }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only an email is given (from validation error)', async () => {
      const updatedCopy = { id, ...emptyPatron(), email: 'invalid_patron@mail.com' },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['email'] }), { sansNestedKeys: ['notNull', 'unique'] }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only an library_id is given (from validation error)', async () => {
      const updatedCopy = { id, ...emptyPatron(), library_id: 'libid' },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['library_id'] }), { sansNestedKeys: ['notNull', 'unique'] }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with prev. data when only an zip_code is given (from validation error)', async () => {
      const updatedCopy = { id, ...emptyPatron(), zip_code: '11111' },
            errors = getValMsgs(withoutVal(valMsgs, { props: ['zip_code'] }), { sansNestedKeys: ['notNull', 'unique'] }),
            res = mockResponse(),
            req = mockRequest({ body: updatedCopy, params: {id} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: updatedCopy, errors });
    });

    it('it should call res.render with no prev. data when only all required fields are empty (from validation error)', async () => {
      const originalPatron = patronData(), updated = emptyPatron();
      const { id } = await patronService.create(originalPatron);
      updated.id = id;

      const errors = getValMsgs(valMsgs, { sansNestedKeys: ['notNull', 'unique'] }),
            res = mockResponse(),
            req = mockRequest({ body: updated, params: {id} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: updated, errors });
    });

    it('it should call res.render with prev. data when a duplicate email is given (from validation error)', async () => {
      const originalPatron = patronData(), nextPatron = patronData();
      const { id: originalId } = await patronService.create(originalPatron);
      const { id: nextId } = await patronService.create(nextPatron);
      nextPatron.email = originalPatron.email;
      nextPatron.id = nextId;

      const errors = getValMsgs(withoutVal(valMsgs, { props: ['library_id'] }), { sansNestedKeys: ['notNull', 'notEmpty', 'is'] }),
            res = mockResponse(),
            req = mockRequest({ body: nextPatron, params: {id: nextId} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: nextPatron, errors });
    });

    it('it should call res.render with prev. data when a duplicate library_id is given (from validation error)', async () => {
      const originalPatron = patronData(), nextPatron = patronData();
      const { id: originalId } = await patronService.create(originalPatron);
      const { id: nextId } = await patronService.create(nextPatron);
      nextPatron.library_id = originalPatron.library_id;
      nextPatron.id = nextId;

      const errors = getValMsgs(withoutVal(valMsgs, { props: ['email'] }), { sansNestedKeys: ['notNull', 'notEmpty', 'is'] }),
            res = mockResponse(),
            req = mockRequest({ body: nextPatron, params: {id: nextId} });
      await patronController.update(req, res);
      expect(res.render).to.have.been.calledWith('patron/update', { dataValues: nextPatron, errors });
    });
  });
});
