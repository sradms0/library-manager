'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { book: bookService } = require('$services');
const { loader } = require('$seed/books');
const { testOperations: testOps } = require('$test/lib');
const { expect } = chai;

const { sequelize } = require('$database/models');
const { models: {Book} } = sequelize;

const bookData = require('$test/data/books.json');
const genreData = require('$test/data/genres.json');

chai.use(require('chai-as-promised'));


describe('services.book.readAll', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });

  it('it should return a Promise', () => {
    expect(bookService.readAll() instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to an array of all Book instances', async () => {
    const books = await bookService.readAll();
    books.forEach(book => expect(book instanceof Book).to.be.true);
  });

  it('it should return should return all books in ascending title-order', async () => {
    const books = await bookService.readAll({ order: [[ 'title', 'ASC' ]] });
    const sortedBookData = [...bookData]
      .sort((b1, b2) => {
        const b1L = b1.title.toLowerCase(), 
              b2L = b2.title.toLowerCase();
        if (b1L < b2L) return -1;
        if (b1L > b2L) return 1;
        return 0;
      });
    books.forEach((dbBook, idx) => {
      expect(dbBook.title).to.eql(sortedBookData[idx].title)
    });
  });
});


describe('services.book.readByPk', async () => {
  const bookData0 = { 
    title: 'title0', 
    author: 'author0',
    genre: 'genre0',
    year: 0
  };
  let id;

  it('create book to find', async () => {
    id  = (await Book.create(bookData0)).id;
  });

  it('it should return a Promise', async () => {
    expect(bookService.readByPk(id) instanceof Promise).to.be.true;
  });

  it('it should return a Promise resolving to a Book instance', async () => {
    expect((await bookService.readByPk(id)) instanceof Book).to.be.true;
  });

  it('it should return null when finding a non-existent book primary key', async () => {
    expect(await bookService.readByPk(-1)).to.be.null;
  });
});


describe('services.book.create', () => {
  it('it should return a promise', () => {
    const bookData1 = { 
      title: 'title1', 
      author: 'author1',
      genre: 'genre1',
      year: 1
    };
    expect(bookService.create(bookData1) instanceof Promise).to.be.true;
  });

  it('it should create one book', async () => {
    const bookData2 = { 
      title: 'title2', 
      author: 'author2',
      genre: 'genre2',
      year: 2
    };

    const book = (await bookService.create(bookData2))?.toJSON(),
          { count, rows } = await Book.findAndCountAll({ where: {title: 'title2'} }),
          bookReturned = rows?.[0]?.toJSON();
    const wasCreated = Object.keys(bookData)
                        .every(prop => bookData2[prop] === bookReturned?.[prop]);

    expect(count === 1 && wasCreated).to.be.true;
  });

  it('it should throw an error when an empty title is given', async () => {
    await expect(bookService.create({ title: '', author: 'author' })).to.be.rejectedWith('"Title" is required');
  });

  it('it should throw an error when a title property doesn\'t exist', async () => {
    await expect(bookService.create({ author: 'author' })).to.be.rejectedWith('"Title" field is required');
  });

  it('it should throw an error when an empty author is given', async () => {
    await expect(bookService.create({ title: 'title', author: '' })).to.be.rejectedWith('"Author" is required');
  });

  it('it should throw an error when an author property doesn\'t exist', async () => {
    await expect(bookService.create({ title: 'title' })).to.be.rejectedWith('"Author" field is required');
  });

  it('it should throw an error when both empty title and author is given', async () => {
    await expect(bookService.create({ title: '', author: '' }))
          .to.be.rejectedWith('Validation error: "Title" is required,\nValidation error: "Author" is required');
  });

  it('it should throw an error when both title and author properties don\'t exist', async () => {
    await expect(bookService.create({}))
          .to.be.rejectedWith('notNull Violation: "Title" field is required,\nnotNull Violation: "Author" field is required');
  });
});


describe('services.book.update', () => {
  before('reload', async () => {
    await testOps.loadTestDb();
  });

  it('it should return a promise', async () => {
    const book = await bookService.readByPk(1);
    const updatedBookData1 = {
      title: 'updated title1', 
      author: 'updated author1',
      genre: 'updated genre1',
      year: 1
    };

    expect(bookService.update(book, updatedBookData1) instanceof Promise).to.be.true;
  });

  it('it should update one book', async () => {
    const book = await bookService.readByPk(2);
    const updatedBookData2 = {
      title: 'updated title2', 
      author: 'updated author2',
      genre: 'updated genre2',
      year: 2
    };

    const updated = (await bookService.update(book, updatedBookData2))?.toJSON();
    const wasUpdated = Object.keys(updatedBookData2)
      .forEach(key => expect(updated?.[key]).to.equal(updatedBookData2[key]));
  });

  let errBook;
  before('', async () => {
    errBook = await bookService.readByPk(3);
  })

  it('it should throw an error when an empty title is given', async () => {
    await expect(bookService.update(errBook, { title: '', author: 'author' })).to.be.rejectedWith('"Title" is required');
  });

  it('it should throw an error when an empty author is given', async () => {
    await expect(bookService.update(errBook, { title: 'title', author: '' })).to.be.rejectedWith('"Author" is required');
  });

  it('it should throw an error when both empty title and author is given', async () => {
    await expect(bookService.update(errBook, { title: '', author: '' }))
          .to.be.rejectedWith('Validation error: "Title" is required,\nValidation error: "Author" is required');
  });
});


describe('services.book.delete', () => {
  let book;

  before('reload', async () => {
    await testOps.loadTestDb();
  });

  beforeEach('fetch first available book to delete', async () => {
    book = (await bookService.readAll())?.[0];
  });

  it('it should return a promise', async () => {
    expect(bookService.delete(book) instanceof Promise).to.be.true;
  });

  it('it should return a promise resolving to the Book instance deleted', async () => {
    expect((await bookService.delete(book)) instanceof Book).to.be.true;
  });

  it('it should delete an existing book', async () => {
    const { id } = book;
    await bookService.delete(book);
    expect(await bookService.readByPk(id)).to.be.null;
  });
});

