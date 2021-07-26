'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { expect } = chai;

const { asyncUtil: {asyncForEach} } = require('$root/lib');
const { testOperations: testOps } = require('$test/lib');

const { 
  book: bookService,
  loan: loanService, 
  patron: patronService 
} = require('$services');


describe('services.loan.readByAttrs.patrons', async () => {
  const patronModelAttrs = testOps.Data.getModelAttrs(patronService.model, { without: [
    'address', 
    'createdAt', 
    'email', 
    'id', 
    'library_id',
    'zip_code',
    'updatedAt'
  ]});

  let name;

  before('reload', async () => {
    await testOps.Data.loadTestDb();
    ({ rows: [{ Patron: { name } }] } = await loanService.readAll());
  });

  it('it should return a promise', async () => {
    expect(loanService.readByAttrs({ query: name }) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a loans total', async () => {
    const { count } = await loanService.readByAttrs({ query: name });
    expect(count).to.equal(1);
  });

  it('it should return a Promise resolving to an object with an array of searched Patron instances per loan', async () => {
    const { rows } = await loanService.readByAttrs({ query: name });
    rows.forEach(({ Patron: patron }) => expect(patron instanceof patronService.model).to.be.true);
  });

  describe('one patron-loanee result', async () => {
    const oneAndFound = (searchRes, patron) => 
      searchRes?.length === 1 && 
      JSON.stringify(searchRes?.[0].Patron) === JSON.stringify(patron);

    let onePatronLoanee;
    before('make one unique name for a patron-loanee', async () => {
      ({ rows: [{ Patron: onePatronLoanee }] } = await loanService.readAll());
      if (onePatronLoanee) {
        onePatronLoanee = await patronService.update(onePatronLoanee, 
          { last_name: 'uniquelast', last_name: 'uniquelast' });
      }
    });

    patronModelAttrs.forEach(attr => {
      it(`it should find one patron-loanee by ${attr}`, async () => {
        const { rows: searched } = await loanService.readByAttrs({ query: onePatronLoanee[attr] }),
              res = oneAndFound(searched, onePatronLoanee);
        expect(res).to.be.true;
      });
    });
  });

  describe('many patron-loanee results', async () => {
    const manyAndFound = (searchRes, patrons) => 
      searchRes?.length === patrons.length && searchRes.every((res, idx) => 
        JSON.stringify(res?.Patron.dataValues) === JSON.stringify(patrons[idx]?.dataValues)
      )

    const nonUniqueData = { 
      first_name: 'samefirst', 
      last_name: 'samelast',
      name: 'samefirst samelast'
    };
    let manyLoanedPatrons = [];

    before('create patron-loanees of identical names with patrons', async () => {
      await testOps.Data.loadTestDb(null);

      const patronData = testOps.Data.patronData(),
            loanData = testOps.Data.loanData(),
            totalSimilar = 5;

      await testOps.Data.addBooks(bookService.create, totalSimilar);
      for (let i = 0; i < totalSimilar; i++) {
        const { id: patron_id } = await patronService.create({ ...patronData({ set:{...nonUniqueData} }) }),
              { id: loanId } = await loanService.create({ ...(await loanData({ set: {patron_id} })) });
        manyLoanedPatrons.push( await patronService.model.findByPk(patron_id) );
      }
    });

    patronModelAttrs.forEach((attr, idx) => {
      it(`it should find many patron-loanees by ${attr}`, async () => {
        const { rows: searched } = await loanService.readByAttrs({ query: nonUniqueData[attr] }),
              res = manyAndFound(searched, manyLoanedPatrons);
        expect(res).to.be.true;
      });
    });
  });

  describe('no patron-loanee results', async () => {
    it('it should find no patron-loanees', async () => {
      const { rows: searched } = await loanService.readByAttrs({ query: null });
      expect(searched).to.be.empty;
    });
  });

  describe('limit and offset', async () => {
    const { Op } = require('sequelize');
    const { model } = loanService,
          { sequelize } = model,
          modelSearch = query => 
            model.findAndCountAll({ 
              where: {
                [Op.or]: [
                  sequelize.literal(`first_name || " " || last_name LIKE "${query}"`),
                  {'$Patron.first_name$': { [Op.like]: `%${query}%`}},
                  {'$Patron.last_name$': { [Op.like]: `%${query}%`}}
                ]
              },
              include: [patronService.model],
              subQuery: false
            });

    const similarNameData = { first_name: 'similarfirst', last_name: 'similarlast' },
          similarWholeName = `${similarNameData.first_name} ${similarNameData.last_name}`;
    let allSearchedPatronLoanees, limitedSearchedPatronLoanees, 
        offset = 0, limit = 0;
    before('create more instances for pagination', async () => {
      await testOps.Data.loadTestDb(null);
      const loanData = testOps.Data.loanData(), total = 20;
      const patronIds = (
        await testOps.Data.addPatrons(
          patronService.create, 
          total, { 
            set: {
            first_name: similarNameData.first_name, 
            last_name: similarNameData.last_name
            }
          }
        )
      ).map(({ id }) => id);
      await testOps.Data.addBooks(bookService.create, total);
      await asyncForEach(patronIds, async patron_id => 
        await loanService.create({ ...(await loanData({ set: {patron_id} })) })
      );

      ({ rows: allSearchedPatronLoanees } = await modelSearch(similarWholeName));
    });

    describe('limit', async () => {
      it('it should return a limit of one searched patron-loanee', async () => {
        limit = 1;
        const firstSearchedPatronLoanee = allSearchedPatronLoanees?.slice(offset,limit);
        limitedSearchedPatronLoanees = await loanService.readByAttrs({ query: similarWholeName, limit, offset });

        const limitCreated = limitedSearchedPatronLoanees.rows.length === firstSearchedPatronLoanee.length &&
          firstSearchedPatronLoanee[0].Patron.name === limitedSearchedPatronLoanees.rows?.[0].Patron.name;
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of some searched patron-loanees', async () => {
        limit = Math.ceil(allSearchedPatronLoanees.length/2);
        const someSearchedPatronLoanees = allSearchedPatronLoanees?.slice(offset,limit);
        limitedSearchedPatronLoanees = await loanService.readByAttrs({ query: similarWholeName, limit, offset });

        const limitCreated = limitedSearchedPatronLoanees.rows.length === someSearchedPatronLoanees.length &&
          someSearchedPatronLoanees.every(({ Patron: patron }, idx) => patron.name === limitedSearchedPatronLoanees?.rows[idx].Patron.name);
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of no searched patron-loanees', async () => {
        limit = offset = 0;
        let { rows: noSearchedPatronLoans } = await loanService.readByAttrs({ query: similarWholeName, limit, offset });
        expect(noSearchedPatronLoans).to.be.empty;
      });

      describe('offset', async () => {
        it('it should return a limit of one searched patron-loanee with an offset greater than zero', async () => {
          offset = limit = 1;
          const secondSearchedPatronLoan = allSearchedPatronLoanees?.slice(offset,limit+1);
          limitedSearchedPatronLoanees = await loanService.readByAttrs({ query: similarWholeName, limit, offset });

          const offsetCreated = limitedSearchedPatronLoanees.rows.length === secondSearchedPatronLoan.length &&
            secondSearchedPatronLoan[0].Patron.name === limitedSearchedPatronLoanees.rows[0].Patron.name;
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of some searched patron-loanees with an offset greater than zero', async () => {
          limit = Math.ceil(allSearchedPatronLoanees.length/2);
          const someSearchedPatronLoanees = allSearchedPatronLoanees?.slice(offset,limit+1);
          limitedSearchedPatronLoanees = await loanService.readByAttrs({ query: similarWholeName, limit, offset });

          const offsetCreated = limitedSearchedPatronLoanees.rows.length === someSearchedPatronLoanees.length &&
            someSearchedPatronLoanees.every(({ Patron: patron }, idx) => patron.name === limitedSearchedPatronLoanees.rows[idx].Patron.name);
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of no patron-loanees with an offset equal to the searched patron-loanees length', async () => {
          const { count } = await modelSearch(similarWholeName);
          limit = 10, offset = count;
          const { rows: noPatrons } = await loanService.readByAttrs({ query: similarWholeName, limit, offset });
          expect(noPatrons).to.be.empty;
        });
      });
    });
  });
});

