import { NextRequest, NextResponse } from 'next/server';
import {
  authCookieOptions,
  extendAuthSession,
  getCurrentUserFromRequest,
} from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Your session has expired. Please sign in again.' },
        { status: 401 }
      );
    }

    const extended = await extendAuthSession(user);
    if (!extended) {
      return NextResponse.json(
        { success: false, message: 'Your session has expired. Please sign in again.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      sessionExpiresAt: extended.expiresAt.toISOString(),
    });
    response.cookies.set({
      ...authCookieOptions(extended.expiresAt),
      value: extended.token,
    });
    return response;
  } catch (error) {
    logger.error(`Session continuation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to continue your session right now.' },
      { status: 500 }
    );
  }
}
