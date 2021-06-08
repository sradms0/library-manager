'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { patron: patronService } = require('$services');


chai.use(require('chai-http'));


describe('views.patron.index.search', () => {
  const modelAttrs = testOps.Data.getModelAttrs(patronService.model, { without: ['id', 'createdAt', 'updatedAt'] });

  const browser = new Browser();
  let requester;

  let form, searchI;
  const setSearchElements = () => {
    form = browser.querySelector('form');
    searchI = browser.querySelector('input#patron-q');
  } 

  before('reload', async () => {
    await testOps.loadTestDb('patron');
  });

  beforeEach('', async() => {
    requester = await chai.request(server).keepOpen();
    await testOps.Route.visitPatrons(browser);
    setSearchElements();
  });

  afterEach('close', () => {
    requester.close();
  });

  describe('search-form', () => {
    it('it should have a form for finding patrons', () => {
      expect(form).to.not.be.null;
    });

    it('it should have a form with get method', () => {
      expect(form?.method).to.equal('get');
    });

    it('it should have a form with an action of /patrons/search', () => {
      const [ action ] =  form?.action?.match(/\/patrons\/search$/g);
      expect(action).to.equal('/patrons/search');
    });

    it('it should have a form with input for patron-searching', () => {
      expect(searchI).to.not.be.null;
    });

    it('it should have a search-form with a button for submitting a search', () => {
      const submitI = form?.querySelector('input[type="submit"]');
      expect(submitI).to.not.be.undefined;
    });

    it('it should set a default page and limit after after submitting a search', async () => {
      const { rows: [{ first_name: firstPatronName }] }  = await patronService.readAll();
      testOps.PatronForm.fillSearch(browser, firstPatronName);
      form?.submit();
      await browser.wait();
      const [ url ] = browser.location._url.match(/\/patrons\/search\?q=.+&page=1&limit=10$/g);
      expect(url).to.not.be.null;
    });
  });

  describe('one patron result', () => {
    const searchOneAndFound = async (browser, form, attrVal, tdChildLoc, equiv) => {
      testOps.PatronForm.fillSearch(browser, attrVal);
      form?.submit();
      await browser.wait();

      const patronTrs = testOps.fetchTrs(browser);
      const { textContent } = patronTrs[0]?.childNodes[tdChildLoc];
      return patronTrs.length === 1 && equiv(textContent, ''+attrVal);
    }

    let onePatron;
    before('', async () => {
      ({ rows:  [onePatron] } = await patronService.readAll());
      if (onePatron)
        onePatron = (await patronService.update(onePatron, { email: 'very_unique@mail.com', library_id: 'very-unique' }));
    });

    modelAttrs.slice(0,3).forEach((attr, idx) => {
      it(`it should show one ${attr}-searched patron`, async () => {
        const equiv = ((/(^first*)|(^last*)/g)).test(attr) ? (a,b) => a.includes(b) : (a,b) => a === b;
        const res = await searchOneAndFound(browser, form, onePatron[attr], 0, equiv);
        expect(res).to.be.true;
      });
    });

    modelAttrs.slice(3).forEach((attr, idx) => {
      it(`it should show one ${attr}-searched patron`, async () => {
        const res = await searchOneAndFound(browser, form, onePatron[attr], idx+1, (a,b) => a === ''+b);
        expect(res).to.be.true;
      });
    });
  });

  describe('many patron results', async () => {
    const sansUniqueModelAttrs = modelAttrs.filter(attr => attr !== 'email' && attr !== 'library_id');

    const searchManyAndFound = async (browser, form, attr, patrons, equiv) => {
      testOps.PatronForm.fillSearch(browser, attr);
      form?.submit();
      await browser.wait();
      const patronTrs = [...testOps.fetchTrs(browser)];

      let trDataString = '';
      patronTrs.forEach((tr, idx) => {
        trDataString += ([...tr.childNodes].reduce((acc, td) => acc+td.textContent+' ', '').trim()+'\n');
      });

      let rawDataString = '';
      patrons.forEach(patron => {
        const JSONPatron = patron.toJSON();
        JSONPatron.name = patron.name;

        const sansKeys = ['id', 'first_name', 'last_name', 'createdAt', 'updatedAt'];
        Object.keys(JSONPatron).forEach(k => sansKeys.indexOf(k) >= 0 && delete JSONPatron[k]);
        rawDataString += (Object.values(JSONPatron).reduce((acc, v) => acc+v+' ', '').trim()+'\n');
      })

      return trDataString === rawDataString;
    }

    let manyPatrons = [];
    let nonUniqueData;

    before('create patrons with identical attrs.', async () => {
      await testOps.loadTestDb('patron');

      const patronData = testOps.Data.patronData();
      const totalSimilar = 5;
      for (let i = 0; i < totalSimilar; i++) {
        nonUniqueData = {
          ...patronData(), ...{
            first_name: 'samefirst', 
            last_name: 'samelast', 
            address: 'sameaddress', 
            zip_code: 11111 
        }};

        // need to fetch after creation since ordering of attrs differ...
        const { id } = await patronService.create(nonUniqueData),
              patron = await patronService.readByPk(id),
              {first_name, last_name} = patron;
        manyPatrons.push(patron);
      }

      const { first_name, last_name } = nonUniqueData;
      nonUniqueData.name = `${first_name} ${last_name}`;
    });

    sansUniqueModelAttrs.forEach(attr => {
      it(`it should show many ${attr}-searched patrons`, async () => {
        const equiv = ((/(^first*)|(^last*)/g)).test(attr) ? (a,b) => a.includes(b) : (a,b) => a === b;
        const res = await searchManyAndFound(browser, form, nonUniqueData[attr], manyPatrons, equiv);
        expect(res).to.be.true;
      });
    });
  });

  describe('no searched-patron results', async () => {
    it('it should find no patrons', async () => {
      testOps.PatronForm.fillSearch(browser, 'DOES NOT EXIST');
      form?.submit();
      await browser.wait();

      const patronTrs = testOps.fetchTrs(browser);
      expect(patronTrs).to.be.empty;
    });
  });
});
