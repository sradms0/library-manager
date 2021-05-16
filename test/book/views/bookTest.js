'use strict';

process.env.NODE_ENV = 'test';

const Browser = require('zombie');
const chai = require('chai');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;
const server = require('$root/bin/www');

const { book: bookService } = require('$services');
const { loader } = require('$seed/books');
const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

const bookData = require('$test/data/books.json');
const genreData = require('$test/data/genres.json');

chai.use(require('chai-as-promised'));
chai.use(require('chai-http'));


describe('views.book.index', () => {
  const browser = new Browser();
  let requester;

  beforeEach('reload', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close', () => {
    requester.close();
  })

  it('it should show all books sorted', async () => {
    const books = await bookService.readAll({ order: [['title', 'ASC']] });
    await testOps.Route.visitBooks(browser);
    const titles = books.map(b => b.title),
          DOMTitles = [...testOps.fetchBookTrs(browser)].map(tr => tr.firstChild.textContent);
    const allFound = DOMTitles.length === titles.length && titles.every((t,i) => t === DOMTitles?.[i]);
    expect(allFound).to.be.true;
  });

  it('it should show one book when all but one books are removed', async () => {
    const books = await bookService.readAll({ order: [['title', 'ASC']] });
    books.slice(0,-1).forEach(async b => await b.destroy());
    await testOps.Route.visitBooks(browser);
    const onlyTitle = (await bookService.readAll())?.[0]?.title,
          DOMTitles = [...testOps.fetchBookTrs(browser)].map(tr => tr.firstChild.textContent),
          onlyDOMTitle = DOMTitles?.pop();
    const lastFound = !DOMTitles.length && onlyTitle === onlyDOMTitle;
    expect(lastFound).to.true;
  });

  it('it should show no books when all books are removed', async () => {
    await Book.destroy({ truncate: true })
    await testOps.Route.visitBooks(browser);
    const bs = testOps.fetchBookTrs(browser);
    expect(bs).to.have.length(0);
  });

  it('it should direct the user to /books/:id/update when clicking on a book', async () => {
    const extractRoute = url => url?.match(/\/books\/(\d+)\/update$/g);

    await testOps.Route.visitBooks(browser);
    const firstBookA = testOps.fetchBookTrs(browser)?.[0].querySelector('a');
    await browser.clickLink(firstBookA);
    const [ firstBookAHrefRoute ] = extractRoute(firstBookA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(firstBookAHrefRoute);
  });

  it('it should have an anchor element to bring the user to /books/new', async () => {
    const extractRoute = url => url?.match(/\/books\/new$/g);

    await testOps.Route.visitBooks(browser);
    const createBookA = browser.querySelector('p a');
    await browser.clickLink(createBookA);

    const [ createBookAHrefRoute ] = extractRoute(createBookA.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(createBookAHrefRoute);
  });
});


describe('views.book.new', () => {
  const browser = new Browser();
  let requester;

  beforeEach('reload', async () => {
    requester = await chai.request(server).keepOpen();
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display a form for creating a new book', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /books/new', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    const [ action ] = form?.action?.match(/\/books\/new$/g);
    expect(action).to.eql('/books/new');
  });

  it('it should show fields for creating a new book', async () => {
    await testOps.Route.visitNewBook(browser);
    const bookDetailIs = browser.querySelectorAll('form p input.book-detail'),
          keys = ['title', 'author', 'genre', 'year'];
    const allFieldsMatch = [...bookDetailIs].every((detail, idx) => 
      detail.name === keys[idx]+''
    );
    expect(bookDetailIs.length && allFieldsMatch).to.be.true;
  });

  it('it should display a button to submit the new-book form', async () => {
    await testOps.Route.visitNewBook(browser);
    const submitI = browser.querySelector('form input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should submit the form, creating a new book', async () => {
    await testOps.Route.visitNewBook(browser);
    const form = browser.querySelector('form');
    testOps.BookForm.fillTitle(browser);
    testOps.BookForm.fillAuthor(browser);
    testOps.BookForm.fillGenre(browser);
    testOps.BookForm.fillYear(browser);
    form.submit();
    await browser.wait();
    await testOps.Route.visitBooks(browser);
    const newBookTitle = [...browser.querySelectorAll('td a')]
      .find(a => a.textContent === 'new title')?.textContent;
    expect(newBookTitle).to.eql('new title');
  });

  it('it should have a cancel link that brings the user back to /books', async () => {
    const extractRoute = url => url.match(/\/books$/g);
    await testOps.Route.visitNewBook(browser);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  describe('error validation rendering', () => {
    const getErrorElements = browser => browser.querySelectorAll('.error');
    let form, errorElements;

    beforeEach('', async () => {
      await testOps.Route.visitNewBook(browser);
      form = browser.querySelector('form');
    });

    it('it should not submit the form and show validation errors when only a title is given for creating a new book', async () => {
      testOps.BookForm.fillTitle(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Author" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. title value after validation errors from creating a new book', async () => {
      const titleVal = 'new title';
      testOps.BookForm.fillTitle(browser, titleVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="title"]');
      expect(value).to.equal(titleVal);
    });

    it('it should not submit the form and show validation errors when only an author is given for creating a new book', async () => {
      testOps.BookForm.fillAuthor(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Title" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. author value after validation errors from creating a new book', async () => {
      const authorVal = 'new author';
      testOps.BookForm.fillAuthor(browser, authorVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="author"]');
      expect(value).to.equal(authorVal);
    });

    it('it should not submit the form and show validation errors when neither title nor author is given for creating a new book', async () => {
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const [errEl1, errEl2] = errorElements;
      const errorShows = errorElements.length === 2 && 
        errEl1.textContent === '"Title" is required' && errEl2.textContent === '"Author" is required';
      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. genre value after validation errors from creating a new book', async () => {
      const genreVal = 'new genre';
      testOps.BookForm.fillGenre(browser, genreVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="genre"]');
      expect(value).to.equal(genreVal);
    });

    it('it should not submit the form and display the prev. year value after validation errors from creating a new book', async () => {
      const yearVal = '1';
      testOps.BookForm.fillYear(browser, yearVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="year"]');
      expect(value).to.equal(yearVal);
    });
  });
});


describe('views.book.update', () => {
  const browser = new Browser();
  let requester;
  let form, id, book, keys;

  beforeEach('', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen(),
    id = 1,
    book = (await bookService.readByPk(id))?.toJSON(),
    keys = ['title', 'author', 'genre', 'year'];
    await testOps.Route.visitOneBook(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display a form for updating a new book', async () => {
    expect(form).to.not.be.null;
  });

  it('it should display a form with a post method', async () => {
    expect(form?.method).to.eql('post')
  });

  it('it should display a form with an action of /books/:id/update', async () => {
    const [ action ] = form?.action?.match(/\/books\/\d+\/update$/g);
    expect(action).to.eql(`/books/${id}/update`);
  });

  it('it should display a button to submit the update-book form', async () => {
    const submitI = browser.querySelector('form input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /books', async () => {
    const extractRoute = url => url.match(/\/books$/g);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should submit the form, updating the existing book', async () => {
    const updated = { 
      title: 'updated title', 
      author: 'updated author', 
      genre: 'updated genre', 
      year: 1
    };
    Object.keys(updated).forEach(key => 
      browser.fill(`input[name=${key}]`, updated[key])
    );
    form.submit();
    await browser.wait();
    await testOps.Route.visitBooks(browser);
    const updatedBookTds = [...testOps.fetchBookTrs(browser)]
                            .find(tr => tr.firstChild.textContent === updated.title)?.children;
    const updatedVals = Object.values(updated);

    let found = 0;
    [...updatedBookTds ]?.forEach((td, idx) => {
      found++;
      expect(td.textContent).to.equal(updatedVals[idx]+'')
    });
    expect(found).to.equal(updatedBookTds.length);
  });

  it('it should shows details of one book', async () => {
    const bookDetailIs = browser.querySelectorAll('p input.book-detail');
    expect(bookDetailIs).to.have.length(4);
    bookDetailIs.forEach((detail, idx) => 
      expect(detail.value).to.eql(book[ keys[idx] ]+'')
    );
  });

  describe('error validation rendering', () => {
    const getErrorElements = browser => browser.querySelectorAll('.error');
    let form, errorElements;

    beforeEach('', async () => {
      await testOps.Route.visitOneBook(browser, 1);
      form = browser.querySelector('form');
    });

    it('it should not submit the form and show validation errors when only a title is given for updating a book', async () => {
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillTitle(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Author" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. title value after validation errors from updating a book', async () => {
      const titleVal = 'updated title';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillTitle(browser, titleVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="title"]');
      expect(value).to.equal(titleVal);
    });

    it('it should not submit the form and show validation errors when only an author is given for updating a book', async () => {
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillAuthor(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const errorShows = errorElements.length === 1 && errorElements?.[0].textContent === '"Title" is required';

      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. author value after validation errors from updating a book', async () => {
      const authorVal = 'updated author';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillAuthor(browser, authorVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="author"]');
      expect(value).to.equal(authorVal);
    });

    it('it should not submit the form and show validation errors when neither title nor author is given for updating a book', async () => {
      testOps.BookForm.clear(browser);
      form.submit();
      await browser.wait();

      errorElements = [...getErrorElements(browser)];
      const [errEl1, errEl2] = errorElements;
      const errorShows = errorElements.length === 2 && 
        errEl1.textContent === '"Title" is required' && errEl2.textContent === '"Author" is required';
      expect(errorShows).to.be.true;
    });

    it('it should not submit the form and display the prev. genre value after validation errors from updating a book', async () => {
      const genreVal = 'updated genre';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillGenre(browser, genreVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="genre"]');
      expect(value).to.equal(genreVal);
    });

    it('it should not submit the form and display the prev. year value after validation errors from updating a book', async () => {
      const yearVal = '1';
      testOps.BookForm.clear(browser)
      testOps.BookForm.fillYear(browser, yearVal);
      form.submit();
      await browser.wait();
      
      const { value } = browser.querySelector('input[name="year"]');
      expect(value).to.equal(yearVal);
    });
  });

  it('it should show a form with an action of /book/:id/update after validation errors occur at least once from updating a book', async () => {
      testOps.BookForm.clear(browser)
      form.submit();
      await browser.wait();

      const [ action ] = form?.action?.match(/\/books\/\d+\/update$/g);
      expect(action).to.eql(`/books/${id}/update`);
  });
});


describe('views.book.delete', () => {
  const browser = new Browser();
  let book, id, requester;

  beforeEach('', async () => {
    await testOps.loadTestDb();
    requester = await chai.request(server).keepOpen(),
    book = (await bookService.readByPk(id))?.[0],
    id = book ? book.id : -1;
    await testOps.Route.visitOneBookDel(browser, id);
    form = browser.querySelector('form');
  });

  afterEach('close', () => {
    requester.close();
  });

  it('it should display the title of the book to delete', () => {
    const { textContent } = browser.querySelector('p em#book-title');
    expect(textContent).to.equal(book.title);
  });

  it('it should display a form with a method of of post', () => {
    expect(form?.method).to.equal('post');
  });

  it('it should display a form with an action of /books/:id/delete', () => {
    const [ action ] = form?.action?.match(/\/books\/\d+\/delete$/g);
    expect(action).to.equall(`/books/${id}/delete`);
  });

  it('it should display a button to submit the delete-book form', () => {
    const submitI = form.querySelector('input[type="submit"]');
    expect(submitI).to.not.be.null;
  });

  it('it should have a cancel link that brings the user back to /books', async () => {
    const extractRoute = url => url?.match(/\/books\/(\d+)\/update$/g);
    const cancelA = browser.querySelector('a.button');
    await browser.clickLink(cancelA);

    const [ cancelAHrefRoute ] = extractRoute(cancelA?.href),
          [ urlRoute ] = extractRoute(browser.location._url);
    expect(urlRoute).to.equal(cancelAHrefRoute);
  });

  it('it should submit the form deleting an existing book', async () => {
    form.submit();
    await browser.wait();
    testOps.Route.visitBooks(browser);
    const noBookA = [...browser.querySelectorAll('td a')].find(a => a.textContent === book.title);
    expect(noBookA).to.be.undefined;
  });
});
