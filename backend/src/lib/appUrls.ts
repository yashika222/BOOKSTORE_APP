const DEFAULT_FRONTEND_URL = 'http://localhost:3000';
const DEFAULT_BACKEND_URL = 'http://localhost:3001';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/** Public origin of the separate frontend application. */
export function getFrontendUrl(): string {
  return trimTrailingSlash(process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL);
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
  const configured = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL)
    .split(',')
    .map((origin) => trimTrailingSlash(origin.trim()))
    .filter(Boolean);
  return Array.from(new Set(configured));
}
