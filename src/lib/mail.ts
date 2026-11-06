import nodemailer from 'nodemailer';
import logger from '@/lib/logger';

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM
  );
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP is not configured.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail(options: {
  to: string;
  resetUrl: string;
  otp: string;
}): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM as string;

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: 'Reset your PageTurner password',
      text: [
        'We received a request to reset your PageTurner Bookstore password.',
        '',
        `Your one-time verification code is: ${options.otp}`,
        '',
        'Open this link to continue. You still need to enter the verification code:',
        options.resetUrl,
        '',
        'This code expires in 15 minutes. If you did not request a reset, you can ignore this email.',
      ].join('\n'),
    });
  } catch (error) {
    logger.error(
      `Password reset email failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw new Error('Unable to send the password reset email.');
  }
}
