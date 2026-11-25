import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  getGoogleOAuthConfig,
  oauthCookieOptions,
  readOAuthNextPath,
} from '@/lib/googleAuth';
import { frontendUrl } from '@/lib/appUrls';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    const loginUrl = new URL(frontendUrl('/login'));
    loginUrl.searchParams.set('error', 'google_not_configured');
    return NextResponse.redirect(loginUrl);
  }

  const state = randomBytes(24).toString('hex');
  const nextPath = readOAuthNextPath(request.nextUrl.searchParams.get('next') || undefined);

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', config.clientId);
  googleUrl.searchParams.set('redirect_uri', config.redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('access_type', 'online');
  googleUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(googleUrl);
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: state,
    ...oauthCookieOptions(10 * 60),
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_NEXT_COOKIE,
    value: nextPath,
    ...oauthCookieOptions(10 * 60),
  });
  return response;
}
