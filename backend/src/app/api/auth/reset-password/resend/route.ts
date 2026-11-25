import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { createOtp, sha256 } from '@/lib/cryptoTokens';
import { isSmtpConfigured, sendPasswordResetEmail } from '@/lib/mail';
import { consumeRateLimit } from '@/lib/rateLimit';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Password reset email is not configured.' },
        { status: 503 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = consumeRateLimit(`resend-reset:${ip}:${email}`, 3, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email }).select(
      '+passwordResetOtpLastSentAt +passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts'
    );
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If that email is registered, a new password reset code has been sent.',
      });
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

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a new password reset code has been sent.',
    });
  } catch (error) {
    logger.error(`Reset OTP resend failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to send a new verification code right now.' },
      { status: 500 }
    );
  }
}
