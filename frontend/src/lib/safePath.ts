const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

export function getSafeInternalPath(value: string | null | undefined, fallback = '/home'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  if (value.includes('://')) return fallback;
  const pathOnly = value.split('?')[0];
  if (AUTH_PATHS.has(pathOnly)) return fallback;
  return value;
}
