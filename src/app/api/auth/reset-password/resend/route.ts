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
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'A valid reset link is required.' },
        { status: 400 }
      );
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Password reset email is not configured.' },
        { status: 503 }
      );
    }

    const limited = consumeRateLimit(`resend:${sha256(token)}`, 3, 15 * 60 * 1000);
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, message: 'Please wait before requesting another verification code.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({
      passwordResetTokenHash: sha256(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('email passwordResetExpires +passwordResetOtpHash +passwordResetOtpExpires');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'This reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    const otp = createOtp();
    user.passwordResetOtpHash = sha256(otp);
    user.passwordResetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl, otp });

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent if this reset link is still valid.',
    });
  } catch (error) {
    logger.error(`OTP resend failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to send a new verification code right now.' },
      { status: 500 }
    );
  }
}
