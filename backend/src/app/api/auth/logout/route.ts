import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  crossSiteCookieOptions,
  getSignedTokenFromRequest,
  revokeSession,
} from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const signedSession = getSignedTokenFromRequest(request, true);
  if (signedSession) {
    await revokeSession(signedSession.jti);
  }
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  // Clear HTTP-only cookie by setting maxAge to 0
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    ...crossSiteCookieOptions(0),
    value: '',
    maxAge: 0,
  });

  return response;
}
