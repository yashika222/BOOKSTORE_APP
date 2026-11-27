import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { createResetToken, sha256 } from '@/lib/cryptoTokens';
import { isEmailConfigured, sendPasswordResetLinkEmail } from '@/lib/mail';
import { frontendUrl } from '@/lib/appUrls';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import logger from '@/lib/logger';

const GENERIC_SUCCESS = {
  success: true,
  message: 'If this email is registered, you will receive password reset instructions.',
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }
    const email =
      body && typeof body === 'object' && !Array.isArray(body) &&
      typeof (body as Record<string, unknown>).email === 'string'
        ? ((body as Record<string, unknown>).email as string).toLowerCase().trim()
        : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const limited = await consumeRateLimit(`forgot-ip:${ip}`, 5, 60 * 60 * 1000);
    if (!limited.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many reset requests. Please try again in ${limited.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Password reset email is not available right now.' },
        { status: 503 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email }).select('+passwordResetLastSentAt');
    if (!user) {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    const accountLimit = await consumeRateLimit(`forgot-account:${email}`, 3, 60 * 60 * 1000);
    const resendWaitMs = 60 * 1000;
    if (
      !accountLimit.allowed ||
      (user.passwordResetLastSentAt &&
        Date.now() - user.passwordResetLastSentAt.getTime() < resendWaitMs)
    ) {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    const resetToken = createResetToken();
    const expiryMinutesValue = Number(process.env.PASSWORD_RESET_LINK_TTL_MINUTES || '15');
    const expiryMinutes =
      Number.isInteger(expiryMinutesValue) && expiryMinutesValue >= 5 && expiryMinutesValue <= 60
        ? expiryMinutesValue
        : 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    user.passwordResetTokenHash = sha256(resetToken);
    user.passwordResetExpires = expiresAt;
    user.passwordResetLastSentAt = new Date();
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = undefined;
    user.passwordResetSessionHash = undefined;
    user.passwordResetSessionExpires = undefined;
    await user.save();
    try {
      await sendPasswordResetLinkEmail({
        to: user.email,
        resetUrl: frontendUrl(`/reset-password?token=${encodeURIComponent(resetToken)}`),
        expiryMinutes,
      });
    } catch (error) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetLastSentAt = undefined;
      await user.save();
      const code =
        error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
          ? error.code
          : 'unknown';
      logger.error(`Password reset link delivery failed (mail error code: ${code}).`);
      return NextResponse.json(
        { success: false, message: 'We could not send the reset link right now. Please try again later.' },
        { status: 503 }
      );
    }
    return NextResponse.json(GENERIC_SUCCESS);
  } catch (error) {
    logger.error(`Forgot-password request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to process the password reset request right now.' },
      { status: 500 }
    );
  }
}
