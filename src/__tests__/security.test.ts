import { describe, it, expect } from 'vitest';
import { validatePassword } from '@/lib/passwordPolicy';
import { createOtp, createResetToken, sha256 } from '@/lib/cryptoTokens';
import { getSafeInternalPath } from '@/lib/safePath';
import { isAllowedEbookHost, getEbookDownloadUrl, getEbookReadUrl } from '@/lib/ebookFormats';
import { bookDetailsHref, parseBookSource, inferBookSource } from '@/lib/bookRoutes';

describe('Security & Auth Validation Suite', () => {
  it('enforces password policy rules', () => {
    expect(validatePassword('short')).not.toBeNull();
    expect(validatePassword('alllettersnodigit')).not.toBeNull();
    expect(validatePassword('1234567890')).not.toBeNull();
    expect(validatePassword('ValidPass123')).toBeNull();
  });

  it('generates secure 6-digit OTP and reset tokens', () => {
    const otp = createOtp();
    expect(otp).toMatch(/^\d{6}$/);

    const token = createResetToken();
    expect(token.length).toBeGreaterThan(32);

    const hash1 = sha256(token);
    const hash2 = sha256(token);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(token);
  });

  it('prevents open redirect attacks via getSafeInternalPath', () => {
    expect(getSafeInternalPath('https://evil.com')).toBe('/home');
    expect(getSafeInternalPath('//evil.com')).toBe('/home');
    expect(getSafeInternalPath('/login')).toBe('/home');
    expect(getSafeInternalPath('/register')).toBe('/home');
    expect(getSafeInternalPath('/books/123')).toBe('/books/123');
    expect(getSafeInternalPath('/cart')).toBe('/cart');
  });

  it('validates allowed ebook download hosts and prevents arbitrary remote fetching', () => {
    expect(isAllowedEbookHost('https://www.gutenberg.org/ebooks/1342.epub.images')).toBe(true);
    expect(isAllowedEbookHost('https://gutenberg.org/files/1342/1342-0.txt')).toBe(true);
    expect(isAllowedEbookHost('https://malicious-site.com/virus.exe')).toBe(false);
    expect(isAllowedEbookHost('http://insecure-http.com')).toBe(false);
  });

  it('extracts correct download and read links from Gutendex formats', () => {
    const formats = {
      'text/html': 'https://www.gutenberg.org/files/1342/1342-h/1342-h.htm',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/1342.epub.images',
    };
    expect(getEbookReadUrl(formats)).toBe('https://www.gutenberg.org/files/1342/1342-h/1342-h.htm');
    expect(getEbookDownloadUrl(formats)).toEqual({
      url: 'https://www.gutenberg.org/ebooks/1342.epub.images',
      label: 'EPUB',
    });
  });

  it('correctly handles book routing and source separation', () => {
    expect(bookDetailsHref('1342', 'gutendex')).toBe('/books/1342?source=gutendex');
    expect(bookDetailsHref('64f1a2b3c4d5e6f7a8b9c0d1', 'store')).toBe('/books/64f1a2b3c4d5e6f7a8b9c0d1?source=store');
    expect(parseBookSource('gutendex')).toBe('gutendex');
    expect(parseBookSource('store')).toBe('store');
    expect(parseBookSource('invalid')).toBe(null);
    expect(inferBookSource('1342', null)).toBe('gutendex');
    expect(inferBookSource('64f1a2b3c4d5e6f7a8b9c0d1', null)).toBe('store');
    expect(inferBookSource('1342', 'store')).toBe('store');
  });
});
