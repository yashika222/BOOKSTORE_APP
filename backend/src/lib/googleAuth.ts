import { NextResponse } from 'next/server';
import { getSafeInternalPath } from '@/lib/safePath';
import { frontendUrl, getBackendUrl } from '@/lib/appUrls';

export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state';
export const GOOGLE_OAUTH_NEXT_COOKIE = 'google_oauth_next';

export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  return `${getBackendUrl()}/api/auth/google/callback`;
}

export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: getGoogleRedirectUri(),
  };
}

export function oauthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function redirectWithGoogleError(_requestUrl: string, code: string) {
  const loginUrl = new URL(frontendUrl('/login'));
  loginUrl.searchParams.set('error', code);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set({ name: GOOGLE_OAUTH_STATE_COOKIE, value: '', ...oauthCookieOptions(0) });
  response.cookies.set({ name: GOOGLE_OAUTH_NEXT_COOKIE, value: '', ...oauthCookieOptions(0) });
  return response;
}

export function readOAuthNextPath(value: string | undefined): string {
  return getSafeInternalPath(value, '/');
}
