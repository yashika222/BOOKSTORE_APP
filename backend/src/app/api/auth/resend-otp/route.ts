import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PendingRegistration from '@/models/PendingRegistration';
import { createOtp, sha256 } from '@/lib/cryptoTokens';
import { consumeRateLimit } from '@/lib/rateLimit';
import { sendVerificationOtpEmail } from '@/lib/mail';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'A valid email is required.' }, { status: 400 });
    }

    const limit = consumeRateLimit(`resend-otp:${email}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many resend requests. Try again in ${limit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return NextResponse.json(
        { success: false, message: 'No pending registration was found for this email.' },
        { status: 404 }
      );
    }
    if (Date.now() - pending.lastSentAt.getTime() < 60 * 1000) {
      return NextResponse.json(
        { success: false, message: 'Please wait 60 seconds before requesting another code.' },
        { status: 429 }
      );
    }

    const otp = createOtp();
    pending.otpHash = sha256(otp);
    pending.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    pending.attempts = 0;
    pending.lastSentAt = new Date();
    await pending.save();
    try {
      await sendVerificationOtpEmail({ to: pending.email, name: pending.name, otp });
    } catch (mailError) {
      logger.error(
        `Resend OTP email failed for ${email}: ${mailError instanceof Error ? mailError.message : 'Unknown error'}`
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
    logger.info(`Registration OTP resent for ${email}`);

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent.',
    });
  } catch (error) {
    logger.error(`Resend OTP failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ success: false, message: 'Unable to resend the code right now.' }, { status: 500 });
  }
}
