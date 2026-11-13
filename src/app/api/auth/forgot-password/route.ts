import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { createOtp, sha256 } from '@/lib/cryptoTokens';
import { isSmtpConfigured, sendPasswordResetEmail } from '@/lib/mail';
import { consumeRateLimit } from '@/lib/rateLimit';
import logger from '@/lib/logger';

const GENERIC_SUCCESS = {
  success: true,
  message: 'If that email is registered, we have sent password reset instructions.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limited = consumeRateLimit(`forgot:${ip}:${email}`, 3, 60 * 60 * 1000);
    if (!limited.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Please wait ${limited.retryAfterSeconds} seconds before requesting another reset.`,
        },
        { status: 429 }
      );
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password reset email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.',
        },
        { status: 503 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email }).select(
      '+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpLastSentAt'
    );
    if (!user) {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    if (
      user.passwordResetOtpLastSentAt &&
      Date.now() - user.passwordResetOtpLastSentAt.getTime() < 60 * 1000
    ) {
      return NextResponse.json(
        { success: false, message: 'Please wait 60 seconds before requesting another code.' },
        { status: 429 }
      );
    }

    const otp = createOtp();
    user.passwordResetOtpHash = sha256(otp);
    user.passwordResetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = new Date();
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetSessionHash = undefined;
    user.passwordResetSessionExpires = undefined;
    await user.save();

    try {
      await sendPasswordResetEmail({ to: user.email, otp });
    } catch (mailError) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetOtpAttempts = 0;
      await user.save();
      throw mailError;
    }
    logger.info('Password reset OTP email sent for a registered account.');

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a password reset code has been sent.',
    });
  } catch (error) {
    logger.error(`Forgot-password request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to process the password reset request right now.' },
      { status: 500 }
    );
  }
}
