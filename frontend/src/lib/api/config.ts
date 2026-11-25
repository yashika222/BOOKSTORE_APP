/**
 * Single source of truth for the backend origin.
 * Only NEXT_PUBLIC_API_URL is used by the browser-facing API layer.
 */
const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

/** Build an absolute URL for links/downloads that are not axios requests. */
export function buildApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Backend responses can contain API-relative media URLs such as
 * `/api/covers?url=...`. Those must be requested from the backend origin.
 */
export function normalizeApiAssetUrl(src?: string): string | undefined {
  if (!src) return src;
  if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  if (src.startsWith('/api/') || src.startsWith('/openapi.json')) {
    return buildApiUrl(src);
  }
  return src;
}
