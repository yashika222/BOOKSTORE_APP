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
  error?: string;
}

interface GoogleUserInfo {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
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
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      logger.warn(`Google token exchange failed: ${tokenPayload.error || tokenResponse.status}`);
      return redirectWithGoogleError(request.url, 'google_failed');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const profile = (await profileResponse.json()) as GoogleUserInfo;
    const googleId = profile.id || profile.sub;
    const email = profile.email?.toLowerCase().trim();
    const name = (profile.name || email?.split('@')[0] || 'Google User').slice(0, 60);

    if (!profileResponse.ok || !googleId || !email) {
      return redirectWithGoogleError(request.url, 'google_failed');
    }

    await connectToDatabase();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        avatar: profile.picture || '',
        role: 'customer',
      });
      logger.info(`New Google user registered: ${email}`);
    } else {
      if (!user.googleId) user.googleId = googleId;
      user.authProvider = user.password ? user.authProvider : 'google';
      if (profile.picture && !user.avatar) user.avatar = profile.picture;
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
