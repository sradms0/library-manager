'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { patron: patronService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


chai.use(require('chai-as-promised'));


describe('services.patron.create', () => {
  const patronData = testOps.Data.patronData();

  before('reload', async () => {
    await testOps.Data.loadTestDb('patron');
  });

  it('it should return a promise', () => {
    const patronData1 = patronData();
    expect(patronService.create(patronData1) instanceof Promise).to.be.true;
  });

  it('it should create one patron', async () => {
    const patronData2 = patronData();

    const patron = (await patronService.create(patronData2))?.toJSON(),
          { count, rows } = await patronService.model.findAndCountAll({ where: {email: 'user2@mail.com'} }),
          patronReturned = rows?.[0]?.toJSON();
    const wasCreated = Object.keys(testOps.Data.patron)
                        .every(prop => patronData2[prop] === patronReturned?.[prop]);

    expect(count === 1 && wasCreated).to.be.true;
  });

  it('it should contain a virtual name property after creating a patron', async () => {
    const patronData3 = patronData(),
          patron = (await patronService.create(patronData3))?.toJSON(),
          { first_name, last_name } = patron;
    expect(patron.name).to.equal(`${first_name} ${last_name}`);
  });

  it('it should throw an error when a first_name of non-alpha chars is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'first_name', val: '1'}))
    ).to.be.rejectedWith('Validation error: Valid First Name is required: letters only');
  });

  it('it should throw an error when an empty first_name is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'first_name', val: ''}))
    ).to.be.rejectedWith('"First Name" is required');
  });

  it('it should throw an error when a first_name property doesn\'t exist', async () => {
    await expect(
      patronService.create(patronData({ prop: 'first_name', del: true}))
    ).to.be.rejectedWith('"First Name" field is required');
  });

  it('it should throw an error when a last_name of non-alpha chars is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'last_name', val: '1'}))
    ).to.be.rejectedWith('Valid Last Name is required: letters only');
  });

  it('it should throw an error when an empty last_name is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'last_name', val: ''}))
    ).to.be.rejectedWith('"Last Name" is required');
  });

  it('it should throw an error when a last_name property doesn\'t exist', async () => {
    await expect(
      patronService.create(patronData({ prop: 'last_name', del: true}))
    ).to.be.rejectedWith('"Last Name" field is required');
  });

  it('it should throw an error when a duplicate email is given', async () => {
    await patronService.model.create(patronData({ pause: true }));
    await expect(
      patronService.create(patronData({ prop: 'library_id', val: '#####' }))
    ).to.be.rejectedWith('Email already exists');
  });

  it('it should throw an error when an non-email is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'email', val: 'email'}))
    ).to.be.rejectedWith('Validation error: Valid Email is required');
  });

  it('it should throw an error when an empty email is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'email', val: ''}))
    ).to.be.rejectedWith('"Email" is required');
  });

  it('it should throw an error when a email property doesn\'t exist', async () => {
    await expect(
      patronService.create(patronData({ prop: 'email', del: true}))
    ).to.be.rejectedWith('"Email" field is required');
  });

  it('it should throw an error when a duplicate library_id is given', async () => {
    await patronService.model.create(patronData({ pause: true }));
    await expect(
      patronService.create(patronData({ prop: 'email', val: 'uniqueuser@mail.com' }))
    ).to.be.rejectedWith('Library ID already exists');
  });

  it('it should throw an error when an empty library_id is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'library_id', val: ''}))
    ).to.be.rejectedWith('"Library ID" is required');
  });

  it('it should throw an error when a library_id property doesn\'t exist', async () => {
    await expect(
      patronService.create(patronData({ prop: 'library_id', del: true}))
    ).to.be.rejectedWith('"Library ID" field is required');
  });

  it('it should throw an error when a zip_code with non-int chars is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'zip_code', val: 'abcde'}))
    ).to.be.rejectedWith('Validation error: Valid Zip Code is required');
  });

  it('it should throw an error when an empty zip_code is given', async () => {
    await expect(
      patronService.create(patronData({ prop: 'zip_code', val: ''}))
    ).to.be.rejectedWith('"Zip Code" is required');
  });

  it('it should throw an error when a zip_code property doesn\'t exist', async () => {
    await expect(
      patronService.create(patronData({ prop: 'zip_code', del: true}))
    ).to.be.rejectedWith('"Zip Code" field is required');
  });

  it('it should throw an error when all empty fields are given', async () => {
    await expect(patronService.create({
      first_name: '',
      last_name: '',
      address: '',
      email: '',
      library_id: '',
      zip_code: '',
    })).to.be.rejectedWith(
      'Validation error: "First Name" is required,\n'+
      'Validation error: Valid First Name is required: letters only,\n'+
      'Validation error: "Last Name" is required,\n'+
      'Validation error: Valid Last Name is required: letters only,\n'+
      'Validation error: "Address" is required,\n'+
      'Validation error: "Email" is required,\n'+
      'Validation error: Valid Email is required,\n'+
      'Validation error: "Library ID" is required,\n'+
      'Validation error: "Zip Code" is required,\n'+
      'Validation error: Valid Zip Code is required'
  );
  });

  it('it should throw an error when all properties don\'t exist', async () => {
    await expect(patronService.create({})).to.be.rejectedWith(
      'notNull Violation: "First Name" field is required,\n'+
      'notNull Violation: "Last Name" field is required,\n'+
      'notNull Violation: "Address" field is required,\n'+
      'notNull Violation: "Email" field is required,\n'+
      'notNull Violation: "Library ID" field is required,\n'+
      'notNull Violation: "Zip Code" field is required'
    );
  });

});

