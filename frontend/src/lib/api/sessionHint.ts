import { API_BASE_URL } from './config';

export const SESSION_HINT_COOKIE = 'bookstore_session';
export const ROLE_HINT_COOKIE = 'bookstore_role';
export const AUTH_ROLE_HINT_MAX_AGE = 60 * 60 * 24 * 7;

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * A non-sensitive UI hint used only by the frontend middleware to gate page
 * navigation. The real JWT stays in the backend HTTP-only cookie and every API
 * request is still authorized by the backend.
 */
export function setSessionHint(user: { id: string; role: 'customer' | 'admin' }): void {
  writeCookie(SESSION_HINT_COOKIE, user.id, AUTH_ROLE_HINT_MAX_AGE);
  writeCookie(ROLE_HINT_COOKIE, user.role, AUTH_ROLE_HINT_MAX_AGE);
}

export function clearSessionHint(): void {
  clearCookie(SESSION_HINT_COOKIE);
  clearCookie(ROLE_HINT_COOKIE);
}
