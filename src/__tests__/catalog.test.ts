import { describe, it, expect } from 'vitest';
import { buildCatalogBooks, BOOK_PAGE_SIZE, CATALOG_TARGET_COUNT } from '@/lib/catalogSeed';
import { PaginationStack } from '@/lib/dsa';

describe('Bookstore catalog and stack pagination', () => {
  it('builds 1000 unique catalog books', () => {
    const books = buildCatalogBooks();
    expect(books).toHaveLength(CATALOG_TARGET_COUNT);
    const isbns = new Set(books.map((book) => book.isbn));
    expect(isbns.size).toBe(CATALOG_TARGET_COUNT);
  });

  it('pages the catalog 20 books at a time', () => {
    const books = buildCatalogBooks();
    const page1 = books.slice(0, BOOK_PAGE_SIZE);
    const page2 = books.slice(BOOK_PAGE_SIZE, BOOK_PAGE_SIZE * 2);
    expect(page1).toHaveLength(20);
    expect(page2).toHaveLength(20);
    expect(page1[0].isbn).not.toBe(page2[0].isbn);
  });

  it('uses a stack so next pushes a page and previous pops it', () => {
    const books = buildCatalogBooks();
    const stack = new PaginationStack<typeof books[number]>();
    stack.reset(books.slice(0, 20));
    stack.push(books.slice(20, 40));
    stack.push(books.slice(40, 60));
    expect(stack.depth()).toBe(3);
    expect(stack.peek()[0].isbn).toBe(books[40].isbn);

    stack.pop();
    expect(stack.depth()).toBe(2);
    expect(stack.peek()[0].isbn).toBe(books[20].isbn);
  });
});
