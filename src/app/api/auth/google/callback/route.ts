import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { AUTH_COOKIE_OPTIONS, signToken } from '@/lib/auth';
import logger from '@/lib/logger';
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  getGoogleOAuthConfig,
  oauthCookieOptions,
  readOAuthNextPath,
  redirectWithGoogleError,
} from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
}

interface GoogleIdTokenInfo {
  aud?: string;
  iss?: string;
  exp?: string;
  email?: string;
  email_verified?: string | boolean;
  sub?: string;
  name?: string;
  picture?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return redirectWithGoogleError(request.url, 'google_not_configured');
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const nextPath = readOAuthNextPath(request.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value);

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithGoogleError(request.url, 'google_denied');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenPayload.id_token) {
      logger.warn(`Google token exchange failed: ${tokenPayload.error || tokenResponse.status}`);
      return redirectWithGoogleError(request.url, 'google_failed');
    }

    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenPayload.id_token)}`
    );
    const tokenInfo = (await tokenInfoResponse.json()) as GoogleIdTokenInfo;
    const issuerOk = tokenInfo.iss === 'https://accounts.google.com' || tokenInfo.iss === 'accounts.google.com';
    const audienceOk = tokenInfo.aud === config.clientId;
    const expiryOk = Number(tokenInfo.exp) * 1000 > Date.now();
    const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === 'true';
    if (!tokenInfoResponse.ok || !issuerOk || !audienceOk || !expiryOk || !emailVerified || !tokenInfo.email || !tokenInfo.sub) {
      logger.warn('Google ID token failed signature, issuer, audience, expiry or email verification checks.');
      return redirectWithGoogleError(request.url, 'google_failed');
    }

    const googleId = tokenInfo.sub;
    const email = tokenInfo.email.toLowerCase().trim();
    const name = (tokenInfo.name || email.split('@')[0] || 'Google User').slice(0, 60);

    await connectToDatabase();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        avatar: tokenInfo.picture || '',
        role: 'customer',
        emailVerified: true,
      });
      logger.info(`New Google user registered: ${email}`);
    } else {
      if (!user.googleId) user.googleId = googleId;
      user.authProvider = user.password ? user.authProvider : 'google';
      if (tokenInfo.picture && !user.avatar) user.avatar = tokenInfo.picture;
      user.emailVerified = true;
      if (!user.name && name) user.name = name;
      await user.save();
      logger.info(`Google user signed in: ${email}`);
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });
    response.cookies.set({ name: GOOGLE_OAUTH_STATE_COOKIE, value: '', ...oauthCookieOptions(0) });
    response.cookies.set({ name: GOOGLE_OAUTH_NEXT_COOKIE, value: '', ...oauthCookieOptions(0) });
    return response;
  } catch (error) {
    logger.error(`Google OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return redirectWithGoogleError(request.url, 'google_failed');
  }
}
