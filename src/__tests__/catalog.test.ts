import { describe, it, expect } from 'vitest';
import { catalogPageSize, DEFAULT_BOOK_PAGE_SIZE, MAX_BOOK_PAGE_SIZE } from '@/lib/catalogPagination';

describe('MongoDB catalog pagination', () => {
  it('caps catalog pages at 20 books', () => {
    expect(DEFAULT_BOOK_PAGE_SIZE).toBe(20);
    expect(MAX_BOOK_PAGE_SIZE).toBe(20);
    expect(catalogPageSize(undefined)).toBe(20);
    expect(catalogPageSize(50)).toBe(20);
    expect(catalogPageSize(1)).toBe(1);
  });

  it('computes 50 pages for 1000 books at 20 per page', () => {
    const total = 1000;
    const limit = catalogPageSize(20);
    expect(Math.ceil(total / limit)).toBe(50);
  });
});
