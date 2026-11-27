import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import {
  comparePassword,
  getCurrentUserFromRequest,
  hashPassword,
  revokeAllUserSessions,
} from '@/lib/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getCurrentUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'A valid account update is required.' }, { status: 400 });
    }
    if ('role' in body || 'email' in body || 'userId' in body || '_id' in body) {
      return NextResponse.json(
        { success: false, message: 'You cannot change protected account fields.' },
        { status: 403 }
      );
    }
    const editableFields = new Set(['name', 'currentPassword', 'newPassword', 'confirmPassword']);
    if (Object.keys(body).some((field) => !editableFields.has(field))) {
      return NextResponse.json(
        { success: false, message: 'The request contains unsupported account fields.' },
        { status: 400 }
      );
    }
    if ('name' in body && typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Name must be text.' },
        { status: 400 }
      );
    }
    if (
      ('currentPassword' in body && typeof body.currentPassword !== 'string') ||
      ('newPassword' in body && typeof body.newPassword !== 'string') ||
      ('confirmPassword' in body && typeof body.confirmPassword !== 'string')
    ) {
      return NextResponse.json(
        { success: false, message: 'Password fields must be text.' },
        { status: 400 }
      );
    }
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if ('name' in body && (name.length < 2 || name.length > 60)) {
      return NextResponse.json(
        { success: false, message: 'Name must be between 2 and 60 characters.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Account updates require a saved database profile.' },
        { status: 404 }
      );
    }

    if (name) user.name = name;

    if (newPassword || currentPassword || body?.confirmPassword) {
      if (!user.password) {
        return NextResponse.json(
          { success: false, message: 'This Google account does not have a password. Sign in with Google instead.' },
          { status: 400 }
        );
      }
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return NextResponse.json({ success: false, message: passwordError }, { status: 400 });
      }
      if (
        typeof body?.confirmPassword !== 'string' ||
        body.confirmPassword !== newPassword
      ) {
        return NextResponse.json(
          { success: false, message: 'The new passwords do not match.' },
          { status: 400 }
        );
      }
      const matches = await comparePassword(currentPassword, user.password);
      if (!matches) {
        return NextResponse.json(
          { success: false, message: 'Your current password is incorrect.' },
          { status: 400 }
        );
      }
      user.password = await hashPassword(newPassword);
      user.passwordChangedAt = new Date();
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetLastSentAt = undefined;
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetOtpAttempts = 0;
      user.passwordResetOtpLastSentAt = undefined;
      user.passwordResetSessionHash = undefined;
      user.passwordResetSessionExpires = undefined;
    }

    await user.save();
    if (newPassword) {
      await revokeAllUserSessions(user._id.toString());
    }
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Account update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to update your account right now.' },
      { status: 500 }
    );
  }
}
