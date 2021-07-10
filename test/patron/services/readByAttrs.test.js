'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const { patron: patronService } = require('$services');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;


describe('services.patron.readByAttrs', async () => {
  const modelAttrs = testOps.Data.getModelAttrs(patronService.model, { without: ['id', 'createdAt', 'updatedAt'] })
  let firstName;

  before('reload', async () => {
    await testOps.Data.loadTestDb('patron');
    ({ rows: [{first_name: firstName}] } = await patronService.readAll());
  });

  it('it should return a promise', async () => {
    expect(patronService.readByAttrs(firstName) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an object with a patron total', async () => {
    const { count } = await patronService.readByAttrs({ query: firstName });
    expect(count).to.equal(1);
  });

  it('it should return a Promise resolving to an object with an array of searched Patron instances', async () => {
    const { rows } = await patronService.readByAttrs(firstName);
    rows.forEach(patron => expect(patron instanceof patronService.model).to.be.true);
  });

  describe('one patron result', async () => {
    const oneAndFound = (searchRes, patron) => 
      searchRes?.length === 1 && 
      JSON.stringify(searchRes?.[0]) === JSON.stringify(patron);

    let onePatron;
    before('', async () => {
      ({ rows: [onePatron] } = await patronService.readAll());
      if (onePatron)
        onePatron = await patronService.update(onePatron, {library_id: 'very-unique'});
    });

    modelAttrs.forEach(attr => {
      it(`it should find one patron by ${attr}`, async () => {
        const { rows: searched } = await patronService.readByAttrs({ query: onePatron[attr] }),
              res = oneAndFound(searched, onePatron);
        expect(res).to.be.true;
      });
    });
  });

  describe('many patron results', async () => {
    const modeAttrsSansUnique = modelAttrs.filter(attr => attr !== 'email' && attr !== 'library_id');
    const manyAndFound = (searchRes, patrons) => 
      searchRes?.length === patrons.length && searchRes.every((res, idx) => 
        JSON.stringify(res.dataValues) === JSON.stringify(patrons[idx].dataValues));

    const nonUniqueData = {
            first_name: 'samefirst', 
            last_name: 'samelast', 
            address: 'sameaddress', 
            zip_code: 11111 
          }
    let manyPatrons = [];
    before('create patrons with identical attrs.', async () => {
      const patronData = testOps.Data.patronData();
      const totalSimilar = 5
      for (let i = 0; i < totalSimilar; i++) {
        const { id } = await patronService.create({ ...patronData(), ...nonUniqueData });
        manyPatrons.push( await patronService.model.findByPk(id) );
      }
      const { first_name, last_name } = nonUniqueData;
      nonUniqueData.name = `${first_name} ${last_name}`;
    });

    modeAttrsSansUnique.forEach((attr, idx) => {
      it(`it should find many patrons by ${attr}`, async () => {
        const { rows: searched } = await patronService.readByAttrs({ query: nonUniqueData[attr] }),
              res = manyAndFound(searched, manyPatrons);
        expect(res).to.be.true;
      });
    });
  });

  describe('no patron results', async () => {
    it('it should find no patrons', async () => {
      const { rows: searched } = await patronService.readByAttrs({ query: null });
      expect(searched).to.be.empty;
    });
  });

  describe('limit and offset', async () => {
    const { Op } = require('sequelize');
    const { model } = patronService,
          modelSearch = query => 
            model.findAndCountAll({ where: {last_name: { [Op.like]: `%${query}%`}} });

    const similarLastNames = 'last';
    let allSearchedPatrons, limitedSearchedPatrons, 
        offset = 0, limit = 0;

    before('create more instances for pagination', async () => {
      await testOps.Data.loadTestDb('patron');
      await testOps.Data.addPatrons(patronService.create, 20);
      ({ rows: allSearchedPatrons } = await modelSearch(similarLastNames));
    });

    describe('limit', async () => {
      it('it should return a limit of one searched-patron', async () => {
        limit = 1;
        const firstSearchedPatron = allSearchedPatrons?.slice(offset,limit);
        limitedSearchedPatrons = await patronService.readByAttrs({ query: similarLastNames, limit, offset });

        const limitCreated = limitedSearchedPatrons.rows.length === firstSearchedPatron.length &&
          firstSearchedPatron[0].last_name === limitedSearchedPatrons.rows[0].last_name;
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of some searched-patrons', async () => {
        limit = Math.ceil(allSearchedPatrons.length/2);
        const someSearchedPatrons = allSearchedPatrons?.slice(offset,limit);
        limitedSearchedPatrons = await patronService.readByAttrs({ query: similarLastNames, limit, offset });

        const limitCreated = limitedSearchedPatrons.rows.length === someSearchedPatrons.length &&
          someSearchedPatrons.every((patron, idx) => patron.last_name === limitedSearchedPatrons.rows[idx].last_name);
        expect(limitCreated).to.be.true;
      });

      it('it should return a limit of no searched-patrons', async () => {
        limit = offset = 0;
        let { rows: noSearchedPatrons } = await patronService.readByAttrs({ query: similarLastNames, limit, offset });
        expect(noSearchedPatrons).to.be.empty;
      });

      describe('offset', async () => {
        it('it should return a limit of one searched-patron with an offset greater than zero', async () => {
          offset = limit = 1;
          const secondSearchedPatron = allSearchedPatrons?.slice(offset,limit+1);
          limitedSearchedPatrons = await patronService.readByAttrs({ query: similarLastNames, limit, offset });

          const offsetCreated = limitedSearchedPatrons.rows.length === secondSearchedPatron.length &&
            secondSearchedPatron[0].last_name === limitedSearchedPatrons.rows[0].last_name;
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of some searched-patrons with an offset greater than zero', async () => {
          limit = Math.ceil(allSearchedPatrons.length/2);
          const someSearchedPatrons = allSearchedPatrons?.slice(offset,limit+1);
          limitedSearchedPatrons = await patronService.readByAttrs({ query: similarLastNames, limit, offset });

          const offsetCreated = limitedSearchedPatrons.rows.length === someSearchedPatrons.length &&
            someSearchedPatrons.every((patron, idx) => patron.last_name === limitedSearchedPatrons.rows[idx].last_name);
          expect(offsetCreated).to.be.true;
        });

        it('it should return a limit of no patrons with an offset equal to the searched-patrons length', async () => {
          const { count } = await modelSearch(similarLastNames);
          limit = 10, offset = count;
          const { rows: noPatrons } = await patronService.readByAttrs({ query: similarLastNames, limit, offset });
          expect(noPatrons).to.be.empty;
        });
      });
    });
  });
});

