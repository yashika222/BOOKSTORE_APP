import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { middleware } from '@/middleware';
import { getAllowedOrigins, getFrontendUrl } from '@/lib/appUrls';

const originalFrontendUrl = process.env.FRONTEND_URL;

afterEach(() => {
  if (originalFrontendUrl === undefined) {
    delete process.env.FRONTEND_URL;
  } else {
    process.env.FRONTEND_URL = originalFrontendUrl;
  }
  vi.unstubAllEnvs();
});

describe('frontend URL configuration', () => {
  it('uses the first configured frontend URL for links and permits each configured origin', () => {
    process.env.FRONTEND_URL = ' https://store.example.com/ , https://preview.example.com ';

    expect(getFrontendUrl()).toBe('https://store.example.com');
    expect(getAllowedOrigins()).toEqual([
      'https://store.example.com',
      'https://preview.example.com',
    ]);
  });

  it('uses the local frontend URL by default', () => {
    delete process.env.FRONTEND_URL;
    vi.stubEnv('NODE_ENV', 'development');

    expect(getFrontendUrl()).toBe('http://localhost:3000');
    expect(getAllowedOrigins()).toEqual(['http://localhost:3000']);
  });

  it('uses the deployed frontend origin by default in production', () => {
    delete process.env.FRONTEND_URL;
    vi.stubEnv('NODE_ENV', 'production');

    expect(getFrontendUrl()).toBe('https://bookstore-app-8m39.vercel.app');
    expect(getAllowedOrigins()).toEqual(['https://bookstore-app-8m39.vercel.app']);
  });

  it('does not let a stale localhost setting override the deployed production origin', () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    vi.stubEnv('NODE_ENV', 'production');

    expect(getFrontendUrl()).toBe('https://bookstore-app-8m39.vercel.app');
    expect(getAllowedOrigins()).toEqual(['https://bookstore-app-8m39.vercel.app']);
  });

  it('returns CORS headers for the deployed frontend preflight in production', () => {
    delete process.env.FRONTEND_URL;
    vi.stubEnv('NODE_ENV', 'production');

    const response = middleware(
      new NextRequest('https://bookstore-app-drab.vercel.app/api/auth/login', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://bookstore-app-8m39.vercel.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      })
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://bookstore-app-8m39.vercel.app'
    );
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });
});
