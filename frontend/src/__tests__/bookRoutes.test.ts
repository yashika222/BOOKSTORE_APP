import { describe, it, expect } from 'vitest';
import { bookDetailsHref, parseBookSource, inferBookSource } from '@/lib/bookRoutes';

describe('Book routing helpers', () => {
  it('builds source-aware book links', () => {
    expect(bookDetailsHref('1342', 'gutendex')).toBe('/books/1342?source=gutendex');
    expect(bookDetailsHref('64f1a2b3c4d5e6f7a8b9c0d1', 'store')).toBe(
      '/books/64f1a2b3c4d5e6f7a8b9c0d1?source=store'
    );
  });

  it('parses and infers book sources', () => {
    expect(parseBookSource('gutendex')).toBe('gutendex');
    expect(parseBookSource('store')).toBe('store');
    expect(parseBookSource('invalid')).toBe(null);
    expect(inferBookSource('1342', null)).toBe('gutendex');
    expect(inferBookSource('64f1a2b3c4d5e6f7a8b9c0d1', null)).toBe('store');
    expect(inferBookSource('1342', 'store')).toBe('store');
  });
});

