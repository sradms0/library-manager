'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { loader } = require('$seed/books');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

chai.use(require('chai-http'));


describe('controllers.book.readByPk', () => {
  let requester;

  before('reload', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen();
  });
  after('close', () => {
    requester.close();
  });

  it('it should set res.status to 200 when a book is found', async () => {
    const res = await requester.get('/books/1');
    expect(res).to.have.status(200);
  });
  it('it should set res.status to 404 when a book is not found', async () => {
    const res = await requester.get('/books/1000');
    expect(res).to.have.status(404);
  });
});



