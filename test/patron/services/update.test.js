'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { patron: patronService } = require('$services');
const { loader } = require('$seed/patrons');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

chai.use(require('chai-as-promised'));


describe('services.patron.update', () => {
  const patronData = testOps.Data.patronData();

  before('reload', async () => {
    await testOps.Data.loadTestDb('patron');
  });

  it('it should return a promise', async () => {
    const patron = await patronService.readByPk(1);
    const updatedPatronData = { ...patron.toJSON(), ...patronData() };
    expect(patronService.update(patron, updatedPatronData) instanceof Promise).to.be.true;
  });

  it('it should update one patron', async () => {
    const patron = await patronService.readByPk(2);
    const updatedPatronData = { ...patron.toJSON(), ...patronData() };

    const updated = (await patronService.update(patron, updatedPatronData))?.toJSON();
    const wasUpdated = Object.keys(updatedPatronData)
      .forEach(key => expect(updated?.[key]+'').to.equal(updatedPatronData[key]+''));
  });

  const { messages: valMsgs} = testOps.Data.getModelValidationErrorMessages('patron');
  let errPatron;
  before('', async () => {
    errPatron = patronData();
    errPatron = await patronService.create(errPatron);
  });

  it('it should throw an error when a first_name of non-alpha chars is given', async () => {
    await expect(
      patronService.update(errPatron, { first_name: '1' })
    ).to.be.rejectedWith(valMsgs.first_name.is);
  });

  it('it should throw an error when an empty first_name is given', async () => {
    await expect(
      patronService.update(errPatron, { first_name: '' })
    ).to.be.rejectedWith(valMsgs.first_name.notEmpty);
  });

  it('it should throw an error when a last_name of non-alpha chars is given', async () => {
    await expect(
      patronService.update(errPatron, { last_name: 'last_name' })
    ).to.be.rejectedWith(valMsgs.last_name.is);
  });

  it('it should throw an error when an empty last_name is given', async () => {
    await expect(
      patronService.update(errPatron, { last_name: ''})
    ).to.be.rejectedWith(valMsgs.last_name.notEmpty);
  });

  it('it should throw an error when a duplicate email is given', async () => {
    await patronService.model.create(patronData({ pause: true }));
    await expect(
      patronService.update(errPatron, patronData({ prop: 'library_id', val: '#####' }))
    ).to.be.rejectedWith(valMsgs.email.unique);
  });

  it('it should throw an error when an non-email is given', async () => {
    await expect(
      patronService.update(errPatron, patronData({ prop: 'email', val: 'email'}))
    ).to.be.rejectedWith(valMsgs.email.isEmail);
  });

  it('it should throw an error when an empty email is given', async () => {
    await expect(
      patronService.update(errPatron, patronData({ prop: 'email', val: ''}))
    ).to.be.rejectedWith(valMsgs.email.notEmpty);
  });

  it('it should throw an error when a duplicate library_id is given', async () => {
    await patronService.model.create(patronData({ pause: true }));
    await expect(
      patronService.update(errPatron, patronData({ prop: 'email', val: 'uniqueuser@mail.com' }))
    ).to.be.rejectedWith(valMsgs.library_id.unique);
  });

  it('it should throw an error when an empty library_id is given', async () => {
    await expect(
      patronService.update(errPatron, patronData({ prop: 'library_id', val: ''}))
    ).to.be.rejectedWith(valMsgs.library_id.notEmpty);
  });

  it('it should throw an error when a zip_code with non-int chars is given', async () => {
    await expect(
      patronService.update(errPatron, patronData({ prop: 'zip_code', val: 'abcde'}))
    ).to.be.rejectedWith(valMsgs.zip_code.isInt);
  });

  it('it should throw an error when an empty zip_code is given', async () => {
    await expect(
      patronService.update(errPatron, patronData({ prop: 'zip_code', val: ''}))
    ).to.be.rejectedWith(valMsgs.zip_code.notEmpty);
  });

  it('it should throw an error when all empty fields are given', async () => {
    const allEmptyValMsgs = testOps.Validation
      .getValMsgs(valMsgs, { sansNestedKeys: ['notNull', 'unique'] })
      .reduce((acc, curr) => acc+`Validation error: ${curr},\n`, '')
      .slice(0,-2)
      await expect(patronService.update(errPatron, testOps.Data.emptyPatron()))
        .to.be.rejectedWith(allEmptyValMsgs);
  });
});

