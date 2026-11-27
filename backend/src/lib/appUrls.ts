const DEFAULT_LOCAL_FRONTEND_URL = 'http://localhost:3000';
const DEFAULT_PRODUCTION_FRONTEND_URL = 'https://bookstore-app-8m39.vercel.app';
const DEFAULT_BACKEND_URL = 'http://localhost:3001';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getConfiguredFrontendUrls(): string[] {
  return (process.env.FRONTEND_URL || DEFAULT_LOCAL_FRONTEND_URL)
    .split(',')
    .map((url) => trimTrailingSlash(url.trim()))
    .filter(Boolean);
}

function getFrontendUrlsForEnvironment(): string[] {
  if (process.env.NODE_ENV === 'production') return [DEFAULT_PRODUCTION_FRONTEND_URL];
  return Array.from(new Set(getConfiguredFrontendUrls()));
}

/** Public origin of the separate frontend application. */
export function getFrontendUrl(): string {
  if (process.env.NODE_ENV === 'production') return DEFAULT_PRODUCTION_FRONTEND_URL;
  return getConfiguredFrontendUrls()[0] || DEFAULT_LOCAL_FRONTEND_URL;
}

/** Public origin of this backend application. */
export function getBackendUrl(): string {
  return trimTrailingSlash(process.env.BACKEND_URL || DEFAULT_BACKEND_URL);
}

/** Build an absolute frontend URL from an internal path. */
export function frontendUrl(path: string): string {
  return `${getFrontendUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Origins permitted to make credentialed cross-origin API requests. */
export function getAllowedOrigins(): string[] {
  return getFrontendUrlsForEnvironment();
}
