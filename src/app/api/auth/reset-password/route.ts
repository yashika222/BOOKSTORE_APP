import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { sha256 } from '@/lib/cryptoTokens';
import { validatePassword } from '@/lib/passwordPolicy';
import { consumeRateLimit } from '@/lib/rateLimit';
import logger from '@/lib/logger';

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
    const token = tokenFromRequest(request, body?.token);
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : '';
    const password = typeof body?.newPassword === 'string' ? body.newPassword : (typeof body?.password === 'string' ? body.password : '');
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!token || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: 'A valid reset link and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

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

    const limited = consumeRateLimit(`reset:${sha256(token)}`, 8, 15 * 60 * 1000);
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many reset attempts. Request a new email.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({
      passwordResetTokenHash: sha256(token),
    }).select(
      '+passwordResetTokenHash +passwordResetExpires +passwordResetOtpHash +passwordResetOtpExpires +password'
    );

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires.getTime() < Date.now() ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpires ||
      user.passwordResetOtpExpires.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { success: false, message: 'This reset link or verification code is invalid or has expired.' },
        { status: 400 }
      );
    }

    if (user.passwordResetOtpHash !== sha256(otp)) {
      return NextResponse.json(
        { success: false, message: 'The verification code is incorrect.' },
        { status: 400 }
      );
    }

    user.password = await hashPassword(password);
    user.passwordChangedAt = new Date();
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();

    logger.info('A user password was reset successfully.');
    return NextResponse.json({
      success: true,
      message: 'Your password has been updated. You can now sign in.',
    });
  } catch (error) {
    logger.error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to reset the password right now.' },
      { status: 500 }
    );
  }
}
