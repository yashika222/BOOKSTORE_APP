import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import PendingRegistration from '@/models/PendingRegistration';
import { authCookieOptions, createAuthSession } from '@/lib/auth';
import { sha256 } from '@/lib/cryptoTokens';
import { consumeRateLimit } from '@/lib/rateLimit';
import { queueEmail, sendWelcomeEmail } from '@/lib/mail';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : '';

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: 'A valid email and six-digit code are required.' },
        { status: 400 }
      );
    }

    const limit = await consumeRateLimit(`verify-otp:${email}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    await connectToDatabase();
    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return NextResponse.json(
        { success: false, message: 'The verification code is invalid or has expired.' },
        { status: 400 }
      );
    }
    if (pending.attempts >= 5) {
      return NextResponse.json(
        { success: false, message: 'The verification code is invalid or has expired. Request a new code.' },
        { status: 400 }
      );
    }
    if (pending.otpExpires.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, message: 'The verification code is invalid or has expired. Request a new code.' },
        { status: 400 }
      );
    }
    if (pending.otpHash !== sha256(otp)) {
      pending.attempts += 1;
      await pending.save();
      return NextResponse.json(
        { success: false, message: 'The verification code is invalid or has expired. Request a new code.' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      await PendingRegistration.deleteOne({ email });
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.passwordHash,
      mobile: pending.mobile,
      role: 'customer',
      emailVerified: true,
      authProvider: 'local',
    });
    await PendingRegistration.deleteOne({ email });

    queueEmail(() => sendWelcomeEmail({ to: user.email, name: user.name }), 'Welcome email');
    logger.info(`Verified and created user ${user.email}`);

    const session = await createAuthSession({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const response = NextResponse.json({
      success: true,
      message: 'Email verified. Your account is ready.',
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    response.cookies.set({ ...authCookieOptions(session.expiresAt), value: session.token });
    return response;
  } catch (error) {
    logger.error(`OTP verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ success: false, message: 'Unable to verify the code right now.' }, { status: 500 });
  }
}
