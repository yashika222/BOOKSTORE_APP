import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { createResetToken, sha256 } from '@/lib/cryptoTokens';
import { crossSiteCookieOptions } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rateLimit';
import logger from '@/lib/logger';

const RESET_SESSION_COOKIE = 'bookstore_password_reset';
const RESET_SESSION_TTL_SECONDS = 10 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: 'A valid email and six-digit code are required.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = consumeRateLimit(`verify-reset:${ip}:${email}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Request a new code.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email }).select(
      '+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts +passwordResetSessionHash +passwordResetSessionExpires'
    );

    if (
      !user ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpires ||
      user.passwordResetOtpExpires.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { success: false, message: 'The code is invalid or has expired. Request a new code.' },
        { status: 400 }
      );
    }

    if ((user.passwordResetOtpAttempts || 0) >= 5) {
      return NextResponse.json(
        { success: false, message: 'Too many incorrect codes. Request a new code.' },
        { status: 429 }
      );
    }

    if (user.passwordResetOtpHash !== sha256(otp)) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      return NextResponse.json(
        { success: false, message: 'The verification code is incorrect.' },
        { status: 400 }
      );
    }

    const resetSession = createResetToken();
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetSessionHash = sha256(resetSession);
    user.passwordResetSessionExpires = new Date(Date.now() + RESET_SESSION_TTL_SECONDS * 1000);
    await user.save();

    const response = NextResponse.json({
      success: true,
      message: 'Code verified. You can now choose a new password.',
    });
    response.cookies.set(RESET_SESSION_COOKIE, resetSession, {
      ...crossSiteCookieOptions(RESET_SESSION_TTL_SECONDS),
      path: '/api/auth/reset-password',
    });
    return response;
  } catch (error) {
    logger.error(`Reset OTP verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to verify the code right now.' },
      { status: 500 }
    );
  }
}
