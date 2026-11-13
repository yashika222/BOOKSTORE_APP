import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import PendingRegistration from '@/models/PendingRegistration';
import { hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import { createOtp, sha256 } from '@/lib/cryptoTokens';
import { consumeRateLimit } from '@/lib/rateLimit';
import { sendVerificationOtpEmail } from '@/lib/mail';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'A valid JSON request body is required.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'A valid registration object is required.' },
        { status: 400 }
      );
    }

    const { name, email, password, mobile } = body as Record<string, unknown>;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
      return NextResponse.json(
        { success: false, message: 'Name must be between 2 and 60 characters long.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Please provide a password.' },
        { status: 400 }
      );
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const limit = consumeRateLimit(`register:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many registration attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const otp = createOtp();
    const hashedPassword = await hashPassword(password);
    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash: hashedPassword,
        mobile: typeof mobile === 'string' ? mobile.trim() : '',
        otpHash: sha256(otp),
        otpExpires: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    try {
      await sendVerificationOtpEmail({ to: normalizedEmail, name: name.trim(), otp });
    } catch (mailError) {
      logger.error(
        `Registration OTP email failed for ${normalizedEmail}: ${
          mailError instanceof Error ? mailError.message : 'Unknown error'
        }`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            mailError instanceof Error
              ? mailError.message
              : 'Unable to send the verification email. Check SMTP configuration.',
        },
        { status: 503 }
      );
    }
    logger.info(`Registration OTP emailed for ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      message: 'Enter the verification code sent to your email to finish creating your account.',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Registration error: ${errorMessage}`);
    return NextResponse.json(
      { success: false, message: 'Unable to start registration right now. Please try again later.' },
      { status: 500 }
    );
  }
}
