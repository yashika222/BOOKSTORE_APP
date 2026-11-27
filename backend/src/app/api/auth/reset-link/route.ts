import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import {
  hashPassword,
  revokeAllUserSessions,
} from '@/lib/auth';
import { sha256 } from '@/lib/cryptoTokens';
import { validatePassword } from '@/lib/passwordPolicy';
import { sendPasswordResetConfirmationEmail } from '@/lib/mail';
import logger from '@/lib/logger';

const INVALID_LINK = 'This reset link is invalid, expired, or has already been used.';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json({ success: false, message: INVALID_LINK }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({
      passwordResetTokenHash: sha256(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('_id');
    if (!user) {
      return NextResponse.json({ success: false, message: INVALID_LINK }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`Reset-link validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to validate this reset link right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'A valid reset request is required.' },
        { status: 400 }
      );
    }

    const values =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const token = typeof values.token === 'string' ? values.token.trim() : '';
    const password =
      typeof values.password === 'string' ? values.password : '';
    const confirmPassword =
      typeof values.confirmPassword === 'string' ? values.confirmPassword : '';

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ success: false, message: INVALID_LINK }, { status: 400 });
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

    await connectToDatabase();
    const now = new Date();
    const passwordHash = await hashPassword(password);
    const user = await User.findOneAndUpdate(
      {
        passwordResetTokenHash: sha256(token),
        passwordResetExpires: { $gt: now },
      },
      {
        $set: { password: passwordHash, passwordChangedAt: now },
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpires: 1,
          passwordResetLastSentAt: 1,
          passwordResetOtpHash: 1,
          passwordResetOtpExpires: 1,
          passwordResetOtpAttempts: 1,
          passwordResetOtpLastSentAt: 1,
          passwordResetSessionHash: 1,
          passwordResetSessionExpires: 1,
        },
      },
      { new: true, runValidators: true }
    ).select('_id email name');

    if (!user) {
      return NextResponse.json({ success: false, message: INVALID_LINK }, { status: 400 });
    }

    await revokeAllUserSessions(user._id.toString());
    try {
      await sendPasswordResetConfirmationEmail({
        to: user.email,
        name: user.name || 'BookStore customer',
      });
    } catch {
      logger.warn('Password reset confirmation email could not be delivered.');
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been updated. You can now sign in.',
    });
  } catch (error) {
    logger.error(`Password reset submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to reset the password right now.' },
      { status: 500 }
    );
  }
}
