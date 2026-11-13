import nodemailer, { Transporter } from 'nodemailer';
import logger from '@/lib/logger';
import { formatCurrency } from '@/lib/currency';

const SMTP_CONFIGURATION_MESSAGE =
  'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in .env.local. For Gmail, use an App Password.';

function normalizeEnv(value: string | undefined): string | undefined {
  return value ? value.trim() : undefined;
}

function isResendConfigured(): boolean {
  return Boolean(normalizeEnv(process.env.EMAIL_API_KEY) && normalizeEnv(process.env.EMAIL_FROM));
}

export function getSmtpConfig() {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const portValue = normalizeEnv(process.env.SMTP_PORT);
  const port = portValue ? Number(portValue) : undefined;
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASSWORD);
  const secure = normalizeEnv(process.env.SMTP_SECURE) === 'true';

  return { host, port, user, pass, secure };
}

export function isSmtpConfigured(): boolean {
  const { host, port, user, pass } = getSmtpConfig();
  return Boolean(host && Number.isFinite(port) && port && port > 0 && user && pass);
}

export function isEmailConfigured(): boolean {
  return isSmtpConfigured() || isResendConfigured();
}

function fromAddress(): string {
  return (
    normalizeEnv(process.env.SMTP_FROM) ||
    normalizeEnv(process.env.EMAIL_FROM) ||
    normalizeEnv(process.env.SMTP_USER) ||
    'bookstore@localhost'
  ) as string;
}

function createSmtpTransporter(): Transporter {
  const { host, port, user, pass, secure } = getSmtpConfig();

  if (!host || !Number.isFinite(port) || !port || !user || !pass) {
    throw new Error(SMTP_CONFIGURATION_MESSAGE);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: secure || port === 465,
    requireTLS: port === 587 && !secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function verifySmtpConnection(): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new Error(SMTP_CONFIGURATION_MESSAGE);
  }

  try {
    await createSmtpTransporter().verify();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP verification error';
    throw new Error(`SMTP verification failed: ${message}. Check SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in .env.local. For Gmail use an App Password.`);
  }
}

async function sendViaResend(options: { to: string; subject: string; html: string; text: string }) {
  const apiKey = normalizeEnv(process.env.EMAIL_API_KEY);
  const senderAddress = normalizeEnv(process.env.EMAIL_FROM) || fromAddress();

  if (!apiKey || !senderAddress) {
    throw new Error('Resend email is not configured. Set EMAIL_API_KEY and EMAIL_FROM.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: senderAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the message (${response.status}).`);
  }
}

async function sendMail(options: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const configuredProvider = (normalizeEnv(process.env.EMAIL_PROVIDER) || 'smtp').toLowerCase();

  if (configuredProvider === 'resend' && isResendConfigured()) {
    await sendViaResend(options);
    return;
  }

  if (isSmtpConfigured()) {
    try {
      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: fromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      if (/(Missing credentials|535|535-5|Authentication|Username and Password not accepted|Invalid login)/i.test(message)) {
        throw new Error('SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD in .env.local and use your Gmail App Password, not your normal Gmail password.');
      }
      throw new Error(`Email delivery failed: ${message}`);
    }
  }

  if (isResendConfigured()) {
    await sendViaResend(options);
    return;
  }

  throw new Error(SMTP_CONFIGURATION_MESSAGE);
}

function wrapHtml(title: string, body: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f5f1f1;font-family:Arial,Helvetica,sans-serif;color:#1f1f1f;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1f1;padding:32px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7d9dc;max-width:600px;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#7d1d29;color:#ffffff;padding:20px 24px;font-size:22px;font-weight:700;letter-spacing:0.4px;">BookStore</td>
            </tr>
            <tr>
              <td style="padding:24px 24px 18px;">
                <h1 style="margin:0 0 16px;font-size:24px;color:#2e2e2e;">${title}</h1>
                ${body}
                <p style="margin-top:24px;margin-bottom:0;font-size:13px;color:#5d5d5d;line-height:1.6;">
                  Need help? Visit <a href="${appUrl}" style="color:#7d1d29;text-decoration:none;font-weight:600;">BookStore</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function queueEmail(task: () => Promise<void>, label: string): void {
  setTimeout(() => {
    void task().catch((error) => {
      logger.error(`${label} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
  }, 0);
}

export async function sendPasswordResetEmail(options: {
  to: string;
  otp: string;
}): Promise<void> {
  try {
    await sendMail({
      to: options.to,
      subject: 'Reset your BookStore password',
      text: [
        'We received a request to reset your BookStore password.',
        '',
        `Your one-time verification code is: ${options.otp}`,
        '',
        'Enter this code on the password reset page. It expires in 15 minutes.',
        'If you did not request a reset, you can ignore this email.',
      ].join('\n'),
      html: wrapHtml(
        'Your password reset code',
        `<p>Use this one-time code to continue resetting your BookStore password:</p>
         <p style="padding:16px;background:#f8f2f3;border-radius:8px;text-align:center;font-size:28px;letter-spacing:8px;font-weight:700;color:#7d1d29;">${options.otp}</p>
         <p>This code expires in 15 minutes. Do not share it with anyone.</p>
         <p>If you did not request a password reset, you can safely ignore this email.</p>`
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Password reset email failed to send: ${message}`);
    throw new Error('Unable to send the password reset email.');
  }
}

export async function sendPasswordResetConfirmationEmail(options: { to: string; name: string }): Promise<void> {
  await sendMail({
    to: options.to,
    subject: 'Your BookStore password has been reset',
    text: `Hi ${options.name},\n\nYour BookStore password was changed successfully. If this was not you, contact support immediately.`,
    html: wrapHtml(
      'Password reset confirmed',
      `<p>Hi ${options.name},</p>
       <p>Your BookStore password was reset successfully.</p>
       <p>If you did not make this change, please contact support immediately and update your password.</p>`
    ),
  });
}

export async function sendVerificationOtpEmail(options: {
  to: string;
  name: string;
  otp: string;
}): Promise<void> {
  await sendMail({
    to: options.to,
    subject: 'Your BookStore verification code',
    text: `Hi ${options.name},\n\nYour verification code is ${options.otp}. It expires in 10 minutes.`,
    html: wrapHtml(
      'Verify your email',
      `<p>Hi ${options.name},</p>
       <p>Your verification code is <strong>${options.otp}</strong>.</p>
       <p>This code expires in 10 minutes. Please do not share it with anyone.</p>`
    ),
  });
}

export async function sendWelcomeEmail(options: { to: string; name: string }): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn('Welcome email skipped because email is not configured.');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  await sendMail({
    to: options.to,
    subject: 'Welcome to BookStore',
    text: `Hi ${options.name},\n\nYour BookStore account is ready. Browse the catalog at ${appUrl}.`,
    html: wrapHtml(
      `Welcome, ${options.name}`,
      `<p>Your BookStore account is ready.</p>
       <p>You can browse books, save your favorites, and place orders with confidence.</p>`
    ),
  });
}

export async function sendLoginNotificationEmail(options: { to: string; name: string }): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn('Login notification skipped because email is not configured.');
    return;
  }

  const when = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  await sendMail({
    to: options.to,
    subject: 'New BookStore sign-in',
    text: `Hi ${options.name},\n\nA new sign-in to your BookStore account occurred on ${when} (IST). If this was not you, reset your password immediately.`,
    html: wrapHtml(
      'New sign-in',
      `<p>Hi ${options.name},</p>
       <p>A new sign-in occurred on <strong>${when} (IST)</strong>.</p>
       <p>If this was not you, reset your password immediately from the login page.</p>`
    ),
  });
}

export async function sendOrderConfirmationEmail(options: {
  to: string;
  name: string;
  orderId: string;
  items: { title: string; quantity: number; price: number }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  status: string;
  orderDate: Date;
  address: {
    fullName: string;
    addressLine: string;
    city: string;
    state?: string;
    postalCode: string;
    phone?: string;
    country?: string;
  };
}): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn('Order confirmation skipped because email is not configured.');
    return;
  }

  const itemRows = options.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0e4e6;">${item.title}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0e4e6;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0e4e6;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('');

  const orderDate = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(options.orderDate);

  await sendMail({
    to: options.to,
    subject: `BookStore order ${options.orderId} confirmed`,
    text: [
      `Hi ${options.name},`,
      `Your order ${options.orderId} has been placed successfully.`,
      '',
      options.items.map((item) => `${item.title} × ${item.quantity} — ${formatCurrency(item.price * item.quantity)}`).join('\n'),
      '',
      `Subtotal: ${formatCurrency(options.subtotal)}`,
      `Delivery: ${formatCurrency(options.shippingFee)}`,
      `Total: ${formatCurrency(options.total)}`,
      `Payment: ${options.paymentMethod}`,
      `Status: ${options.status}`,
      `Order date: ${orderDate}`,
      `Deliver to: ${options.address.fullName}, ${options.address.addressLine}, ${options.address.city} ${options.address.postalCode}`,
    ].join('\n'),
    html: wrapHtml(
      `Order ${options.orderId} confirmed`,
      `<p>Hi ${options.name},</p>
       <p>Your order has been placed successfully.</p>
       <table width="100%" style="border-collapse:collapse;font-size:14px;color:#2d2d2d;margin:16px 0;">
         <thead>
           <tr>
             <th style="text-align:left;padding:10px 0;border-bottom:1px solid #d7c1c4;color:#7d1d29;">Book</th>
             <th style="text-align:center;padding:10px 0;border-bottom:1px solid #d7c1c4;color:#7d1d29;">Qty</th>
             <th style="text-align:right;padding:10px 0;border-bottom:1px solid #d7c1c4;color:#7d1d29;">Total</th>
           </tr>
         </thead>
         <tbody>${itemRows}</tbody>
       </table>
       <p style="margin:12px 0;">Order date: <strong>${orderDate}</strong></p>
       <p style="margin:12px 0;">Subtotal: ${formatCurrency(options.subtotal)}<br />
          Delivery: ${formatCurrency(options.shippingFee)}<br />
          <strong>Total: ${formatCurrency(options.total)}</strong></p>
       <p style="margin:12px 0;">Payment: ${options.paymentMethod}<br />Status: ${options.status}</p>
       <p style="margin:12px 0;">Shipping to:<br />
          ${options.address.fullName}<br />
          ${options.address.addressLine}<br />
          ${options.address.city}${options.address.state ? `, ${options.address.state}` : ''} ${options.address.postalCode}<br />
          ${options.address.phone ? `${options.address.phone}<br />` : ''}
          ${options.address.country || 'India'}</p>`
    ),
  });
}
