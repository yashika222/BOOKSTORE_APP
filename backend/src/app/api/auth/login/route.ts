import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { authCookieOptions, comparePassword, createAuthSession } from '@/lib/auth';
import logger from '@/lib/logger';
import { queueEmail, sendLoginNotificationEmail } from '@/lib/mail';
import { consumeRateLimit, getClientIp, resetRateLimit } from '@/lib/rateLimit';

function limitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      success: false,
      message: `Too many sign-in attempts. Please try again in ${retryAfterSeconds} seconds.`,
    },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'A valid email address and password are required.' },
        { status: 400 }
      );
    }

    const credentials =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const email = typeof credentials.email === 'string' ? credentials.email.trim().toLowerCase() : '';
    const password = typeof credentials.password === 'string' ? credentials.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 72) {
      return NextResponse.json(
        { success: false, message: 'A valid email address and password are required.' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const ipLimit = await consumeRateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000);
    const accountLimit = await consumeRateLimit(`login-account:${email}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed || !accountLimit.allowed) {
      const retries = [
        ipLimit.allowed ? 0 : ipLimit.retryAfterSeconds,
        accountLimit.allowed ? 0 : accountLimit.retryAfterSeconds,
      ];
      return limitedResponse(Math.max(...retries));
    }

    await connectToDatabase();
    const user = await User.findOne({ email }).select('+password');
    const passwordMatches =
      Boolean(user?.password) && (await comparePassword(password, user?.password || ''));

    if (!user || !user.password || !passwordMatches || user.emailVerified === false) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    await resetRateLimit(`login-account:${email}`);
    await resetRateLimit(`login-ip:${ip}`);
    const session = await createAuthSession({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    queueEmail(
      () => sendLoginNotificationEmail({ to: user.email, name: user.name }),
      'Login notification'
    );

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    response.cookies.set({
      ...authCookieOptions(session.expiresAt),
      value: session.token,
    });
    return response;
  } catch (error) {
    logger.error(`Login request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to log in right now. Please try again later.' },
      { status: 500 }
    );
  }
}
