const DEFAULT_LOCAL_FRONTEND_URL = 'http://localhost:3000';
const DEFAULT_PRODUCTION_FRONTEND_URL = 'https://bookstore-app-8m39.vercel.app';
const DEFAULT_BACKEND_URL = 'http://localhost:3001';
const LOCAL_FRONTEND_URL_PATTERN =
  /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i;

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

function getFrontendUrlsForEnvironment(): string[] {
  const configured = getConfiguredFrontendUrls();
  if (process.env.NODE_ENV !== 'production') return configured;

  const productionOrigins = configured.filter((url) => !LOCAL_FRONTEND_URL_PATTERN.test(url));
  productionOrigins.push(DEFAULT_PRODUCTION_FRONTEND_URL);
  return Array.from(new Set(productionOrigins));
}

/** Public origin of the separate frontend application. */
export function getFrontendUrl(): string {
  return getFrontendUrlsForEnvironment()[0] || getDefaultFrontendUrl();
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
