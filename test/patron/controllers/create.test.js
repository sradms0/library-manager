'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { patron: patronController } = require('$controllers');
const { patron: patronService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.patron.create', () => {
  const patronData = testOps.Data.patronData();

  beforeEach('reload', async () => {
    await testOps.loadTestDb('patron');
  });

  it('it should create one patron when all required attributes are given', async () => {
    const id = 100,
          res = mockResponse(),
          req = mockRequest({ body: patronData({ prop: 'id', val: id }) });
    await patronController.create(req, res);
    expect(await patronService.readByPk(id)).to.not.be.null;
  });

  it('it should redirect the user to /patrons after a patron is created', async () => {
    const res = mockResponse(),
          req = mockRequest({ body: patronData() });
    await patronController.create(req, res);
    expect(res.redirect).to.have.been.calledWith('/patrons');
  });

  describe('validation errors', () => {
    const emptyPatron = testOps.Data.emptyPatron;

    const { messages: valMsgs } = testOps.Data.getModelValidationErrorMessages('patron'); 
    const withoutVal = (...without) => {
      const cpy = {...valMsgs};
      without.forEach(k => delete cpy[k]);
      return cpy;
    }

    const getEmptyAndInvValMsgs = (valObjs, ...sansNestedKeys) => {
      const valObjKeys = Object.keys(valObjs), msgs = [];
      valObjKeys.forEach(k => {
        let nestedKeys = Object.keys(valObjs[k]);
        sansNestedKeys && (
          nestedKeys = nestedKeys.filter(nk => 
            !sansNestedKeys.find(snk => new RegExp(`^${snk}`, 'g').test(nk)))
          );
        nestedKeys.forEach(nk => {
          msgs.push(valObjs[k][nk]);
        })
      });
      return msgs;
    }

    it('it should call res.render with prev. data when only a first_name is given (from validation error)', async () => {
      const patron = { ...emptyPatron(), ...{ first_name: 'first' } },
            errors = getEmptyAndInvValMsgs(withoutVal('first_name'), 'notNull', 'unique'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with prev. data when only a last_name is given (from validation error)', async () => {
      const patron = { ...emptyPatron(), ...{ last_name: 'last' } },
            errors = getEmptyAndInvValMsgs(withoutVal('last_name'), 'notNull', 'unique'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with prev. data when only an address is given (from validation error)', async () => {
      const patron = { ...emptyPatron(), ...{ address: '123 road' } },
            errors = getEmptyAndInvValMsgs(withoutVal('address'), 'notNull', 'unique'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with prev. data when only an email is given (from validation error)', async () => {
      const patron = { ...emptyPatron(), ...{ email: 'invalid_patron@mail.com' } },
            errors = getEmptyAndInvValMsgs(withoutVal('email'), 'notNull', 'unique'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with prev. data when only an library_id is given (from validation error)', async () => {
      const patron = { ...emptyPatron(), ...{ library_id: 'libid' } },
            errors = getEmptyAndInvValMsgs(withoutVal('library_id'), 'notNull', 'unique'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with prev. data when only an zip_code is given (from validation error)', async () => {
      const patron = { ...emptyPatron(), ...{ zip_code: '11111' } },
            errors = getEmptyAndInvValMsgs(withoutVal('zip_code'), 'notNull', 'unique'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with no prev. data when only all required fields are empty (from validation error)', async () => {
      const patron = emptyPatron(),
            errors = getEmptyAndInvValMsgs({...valMsgs}, 'notNull', 'unique'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with prev. data when a duplicate email is given (from validation error)', async () => {
      const patron = patronData();
      await patronService.create(patron);
      patron.library_id = 'unique_id';

      const errors = getEmptyAndInvValMsgs(withoutVal('library_id'), 'notNull', 'notEmpty', 'is'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });

    it('it should call res.render with prev. data when a duplicate library_id is given (from validation error)', async () => {
      const patron = patronData();
      await patronService.create(patron);
      patron.email = 'unique_email@mail.com';

      const errors = getEmptyAndInvValMsgs(withoutVal('email'), 'notNull', 'notEmpty', 'is'),
            res = mockResponse(),
            req = mockRequest({ body: patron });
      await patronController.create(req, res);
      expect(res.render).to.have.been.calledWith('patron/new', { dataValues: {id: null, ...patron }, errors });
    });
  });
});

