import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, crossSiteCookieOptions } from '@/lib/auth';
import { sha256 } from '@/lib/cryptoTokens';
import { validatePassword } from '@/lib/passwordPolicy';
import { consumeRateLimit } from '@/lib/rateLimit';
import { sendPasswordResetConfirmationEmail } from '@/lib/mail';
import logger from '@/lib/logger';

const RESET_SESSION_COOKIE = 'bookstore_password_reset';

function tokenFromRequest(request: NextRequest, bodyToken?: unknown): string {
  if (typeof bodyToken === 'string' && bodyToken.trim()) return bodyToken.trim();
  return request.nextUrl.searchParams.get('token')?.trim() || '';
}

export async function GET(request: NextRequest) {
  const token = tokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'A valid reset link is required.' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({
      passwordResetTokenHash: sha256(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('_id passwordResetExpires');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'This reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enter the verification code from your email to continue.',
    });
  } catch (error) {
    logger.error(`Reset token lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to validate the reset link right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body?.newPassword === 'string' ? body.newPassword : (typeof body?.password === 'string' ? body.password : '');
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'The new passwords do not match.' },
        { status: 400 }
      );
    }

    const resetSession = request.cookies.get(RESET_SESSION_COOKIE)?.value || '';
    if (!resetSession) {
      return NextResponse.json(
        { success: false, message: 'Verify the code from your email before choosing a new password.' },
        { status: 401 }
      );
    }

    const sessionHash = sha256(resetSession);
    const limited = consumeRateLimit(`reset:${sessionHash}`, 8, 15 * 60 * 1000);
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many reset attempts. Request a new email.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({
      passwordResetSessionHash: sessionHash,
      passwordResetSessionExpires: { $gt: new Date() },
    }).select(
      '+passwordResetSessionHash +passwordResetSessionExpires +password'
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Password reset verification expired. Request a new code.' },
        { status: 401 }
      );
    }

    user.password = await hashPassword(password);
    user.passwordChangedAt = new Date();
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetSessionHash = undefined;
    user.passwordResetSessionExpires = undefined;
    await user.save();

    try {
      await sendPasswordResetConfirmationEmail({ to: user.email, name: user.name || 'BookStore customer' });
    } catch (mailError) {
      logger.warn(
        `Password reset confirmation email failed for ${user.email}: ${
          mailError instanceof Error ? mailError.message : 'Unknown error'
        }`
      );
    }

    logger.info('A user password was reset successfully.');
    const response = NextResponse.json({
      success: true,
      message: 'Your password has been updated. You can now sign in.',
    });
    response.cookies.set(RESET_SESSION_COOKIE, '', {
      ...crossSiteCookieOptions(0),
      path: '/api/auth/reset-password',
    });
    return response;
  } catch (error) {
    logger.error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to reset the password right now.' },
      { status: 500 }
    );
  }
}
