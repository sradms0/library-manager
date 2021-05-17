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


describe('services.book.readByAttrs', async () => {
  let title;

  before('reload', async () => {
    await testOps.loadTestDb();
    ({ title } = (await bookService.readAll())?.[0]);
  });

  it('it should return a promise', async () => {
    expect(bookService.readByAttrs(title) instanceof Promise).to.be.true;
  });

  it('it should return a promise resolving to an array of from the search', async () => {
    expect((await bookService.readByAttrs(title)) instanceof Array).to.be.true;
  });

  it('it should return a promise resolving to an array of book instances', async () => {
    const searched = await bookService.readByAttrs(title);
    searched.forEach(book => expect(book instanceof Book).to.be.true);
  });

  describe('one book result', async () => {
    const oneAndFound = (searchRes, book) => 
      searchRes?.length === 1 && 
      JSON.stringify(searchRes?.[0]) === JSON.stringify(book);

    let oneBook, title, author, genre, year;

    before('', async () => {
      oneBook = (await bookService.readAll())?.[0];
      if (oneBook) {
        bookService.update(oneBook, {genre: 'very unique'});
        oneBook = (await bookService.readAll())?.[0];
        ({ title, author, genre, year } = oneBook);
      }
    });

    it('it should find one book by its title', async() => {
      const titleSearched = await bookService.readByAttrs(title),
            res = oneAndFound(titleSearched, oneBook);
      expect(res).to.be.true;
    });

    it('it should find one book by its author', async() => {
      const authorSearched = await bookService.readByAttrs(author),
            res = oneAndFound(authorSearched, oneBook);
      expect(res).to.be.true;
    });

    it('it should find one book by its genre', async() => {
      const genreSearched = await bookService.readByAttrs(genre),
            res = oneAndFound(genreSearched, oneBook);
      expect(res).to.be.true;
    });

    it('it should find one book by its year', async() => {
      const yearSearched = await bookService.readByAttrs(author),
            res = oneAndFound(yearSearched, oneBook);
      expect(res).to.be.true;
    });
  });

  describe('many book results', async () => {
    const manyAndFound = (searchRes, books) => 
      searchRes?.length === books.length && searchRes.every((res, idx) => 
        JSON.stringify(res.dataValues) === JSON.stringify(books[idx].dataValues));

    let manyBooks = [];
    const title = 'title',
          author = 'author',
          genre = 'genre',
          year = 'year';

    before('create books with identical attrs.', async () => {
      const totalSimilar = 5
      for (let i = 0; i < totalSimilar; i++) {
        // need to fetch after creation since ordering of attrs differ...
        const { id } = await bookService.create({ title, author, genre, year });
        manyBooks.push( await bookService.readByPk(id) );
      }
    });

    it('it should find many books by title', async () => {
      const titleSearched = await bookService.readByAttrs(title),
            res = manyAndFound(titleSearched, manyBooks);
      expect(res).to.be.true;
    });

    it('it should find many books by author', async () => {
      const authorSearched = await bookService.readByAttrs(author),
            res = manyAndFound(authorSearched, manyBooks);
      expect(res).to.be.true;
    });

    it('it should find many books by genre', async () => {
      const genreSearched = await bookService.readByAttrs(genre),
            res = manyAndFound(genreSearched, manyBooks);
      expect(res).to.be.true;
    });

    it('it should find many books by year', async () => {
      const yearSearched = await bookService.readByAttrs(year),
            res = manyAndFound(yearSearched, manyBooks);
      expect(res).to.be.true;
    });
  });

  describe('no book results', async () => {
    it('it should find no books', async () => {
      const searched = await bookService.readByAttrs(null);
      expect(searched).to.be.empty;
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

