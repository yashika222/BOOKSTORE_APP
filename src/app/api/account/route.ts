import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, getCurrentUserFromRequest, hashPassword } from '@/lib/auth';
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
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (name && (name.length < 2 || name.length > 60)) {
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

    if (newPassword) {
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
      const matches = await comparePassword(currentPassword, user.password);
      if (!matches) {
        return NextResponse.json(
          { success: false, message: 'Your current password is incorrect.' },
          { status: 400 }
        );
      }
      user.password = await hashPassword(newPassword);
      user.passwordChangedAt = new Date();
    }

    if (body?.role) {
      return NextResponse.json(
        { success: false, message: 'You cannot change your account role.' },
        { status: 403 }
      );
    }

    await user.save();
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
