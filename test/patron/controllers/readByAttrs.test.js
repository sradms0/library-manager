'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const { loader } = require('$seed/patrons');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/app');

const { patron: patronController } = require('$controllers');
const { patron: patronService } = require('$services');

const { mockRequest, mockResponse } = require('mock-req-res')


chai.use(require('sinon-chai'));


describe('controllers.patron.readByAttrs', () => {
  const modelAttrs = testOps.Data.getModelAttrs(patronService.model, { without: ['id', 'createdAt', 'updatedAt'] });

  before('reload', async () => {
    await testOps.loadTestDb('patron');
  });

  describe('one patron result', async () => {
    let patrons;
    let page, limit;
    before('', async () => {
      patrons = (await patronService.readAll()).rows.slice(0,1);
      if (patrons.length) 
        patrons = [ await patronService.update(patrons[0], {library_id: 'very-unique'}) ];
    });

    modelAttrs.forEach(attr => {
      it(`it should render one searched patron by its ${attr}`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: patrons[0][attr]} });
        await patronController.readByAttrs(req, res);
        expect(res.render).to.have.been.calledWith('patron/index', { patrons });
      });
    })
  });

  describe('many patron results', async () => {
    const modeAttrsSansUnique = modelAttrs.filter(attr => attr !== 'email' && attr !== 'library_id');
    const nonUniqueData = {
      first_name: 'samefirst', 
      last_name: 'samelast', 
      address: 'sameaddress', 
      zip_code: 11111 
    };

    const patrons = [];

    before('create patrons with identical attrs.', async () => {
      const patronData = testOps.Data.patronData();
      const totalSimilar = 5
      for (let i = 0; i < totalSimilar; i++) {
        // need to fetch after creation since ordering of attrs differ...
        const { id } = await patronService.create({ ...patronData(), nonUniqueData });
        patrons.push( await patronService.readByPk(id) );
      }
    });

    modelAttrsSansUnique.forEach(attr => {
      it(`it should render many searched patrons by their ${attr}`, async () => {
        const res = mockResponse(),
              req = mockRequest({ query: {q: nonUniqueData[attr]} });
        await patronController.readByAttrs(req, res);
        expect(res.render).to.have.been.calledWith('patron/index', { patrons });
      });
    });
  });

  describe('no patron results', async () => {
    const patrons = []

    it('it should render no patrons', async () => {
      const res = mockResponse(),
            req = mockRequest({ query: {q: null} });
      await patronController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('patron/index', { patrons });
    });
  });

  describe('pagination parameters', () => {
    const qplPath = (q, page, limit) => `/patrons/search?q=${q}&page=${page}&limit=${limit}`;

    const similarTitles = 'title', q = similarTitles;
    let page, limit, res;

    before('', async () => {
      await testOps.loadTestDb('patron');
      await testOps.Data.addPatrons(patronService.create, 20);
    });


    beforeEach('', () => {
      res = mockResponse();
    });

    it('it should call res.render with patron/index and a limited/offset patrons object with pagination configuration', async () => {
      page = 1, limit = 10;
      const req = mockRequest({ query: {q, page, limit} });
      const { rows: patrons, count } = await patronService.readByAttrs({ query: q, limit, offset: page*limit-limit });
      const totalPages = Math.ceil(count/limit);
      await patronController.readByAttrs(req, res);
      expect(res.render).to.have.been.calledWith('patron/index', { patrons, page, limit, totalPages, paginationRoot: `/patrons/search?q=${q}&`});
    });

  it('it should call res.render with patron/index and only an all patrons object when a page and limit aren\'t given', async () => {
    page = limit = undefined;
    const req = mockRequest({ query: {q, page, limit} });
    const { rows: patrons } = await patronService.readByAttrs({ query: q });
    await patronController.readByAttrs(req, res);
    expect(res.render).to.have.been.calledWith('patron/index', { patrons });
  });

    it('it should redirect to /patrons/search?q={q}&page={page}&limit={limit} when the page is equal to zero', async () => {
    page = 0, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await patronController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, 1, limit));
  });

  it('it should redirect to /patrons/search?q={q}&page={page}&limit={limit} when the page is negative', async () => {
    page = -1, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await patronController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, -1*page, limit));
  });

  it('it should redirect to /patrons/search?q={q}&page={page}&limit={limit} when the limit is equal to zero', async () => {
    page = 1, limit = 0;
    const req = mockRequest({ query: {q, page, limit} });
    await patronController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, page, 10));
  });

  it('it should redirect to /patrons/search?q={q}&page={page}&limit={limit} when the limit is negative', async () => {
    page = 1, limit = -10;
    const req = mockRequest({ query: {q, page, limit} });
    await patronController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, page, -1*limit));
  });

  it('it should redirect to /patrons/search?q={q}&page={page}&limit={limit} when the page undefined', async () => {
    page = undefined, limit = 10;
    const req = mockRequest({ query: {q, page, limit} });
    await patronController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, 1, limit));
  });

  it('it should redirect to /patrons/search?q={q}&page={page}&limit={limit} when the limit undefined', async () => {
    page = 1, limit = undefined;
    const req = mockRequest({ query: {q, page, limit} });
    await patronController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, page, 10));
  });

  it('it should redirect to /patrons/search?q={q}&page={page}&limit={limit} when both the page and limit are negative', async () => {
    page = -1, limit = -10;
    const req = mockRequest({ query: {q, page, limit} });
    await patronController.readByAttrs(req, res);
    expect(res.redirect).to.have.been.calledWith(qplPath(q, -1*page, -1*limit));
  });
  })
});
