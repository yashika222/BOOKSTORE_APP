const DEFAULT_LOCAL_FRONTEND_URL = 'http://localhost:3000';
const DEFAULT_PRODUCTION_FRONTEND_URL = 'https://bookstore-app-8m39.vercel.app';
const DEFAULT_BACKEND_URL = 'http://localhost:3001';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getDefaultFrontendUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? DEFAULT_PRODUCTION_FRONTEND_URL
    : DEFAULT_LOCAL_FRONTEND_URL;
}

function getConfiguredFrontendUrls(): string[] {
  return (process.env.FRONTEND_URL || getDefaultFrontendUrl())
    .split(',')
    .map((url) => trimTrailingSlash(url.trim()))
    .filter(Boolean);
}

/** Public origin of the separate frontend application. */
export function getFrontendUrl(): string {
  return getConfiguredFrontendUrls()[0] || getDefaultFrontendUrl();
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
  return Array.from(new Set(getConfiguredFrontendUrls()));
}
