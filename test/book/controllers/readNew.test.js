'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/books');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { book: bookController } = require('$controllers');
const { book: bookService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.book.readNew', () => {
  it('it should render book/new', async () => {
    const res = mockResponse(),
          req = mockRequest();
    await bookController.readNew(req, res);
    expect(res.render).to.have.been.calledWith(
      'book/new', 
      { dataValues: {'id':'', 'title':'', 'author':'', 'genre':'', 'year':'', 'createdAt':'', 'updatedAt':''} }
    );
  });
});

