import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';

function loadEnv(fileName) {
  if (!existsSync(fileName)) return;
  for (const line of readFileSync(fileName, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv('.env.local');
loadEnv('.env');

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;

if (!host || !user || !pass) {
  console.error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD in .env.local.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: process.env.SMTP_SECURE === 'true' || port === 465,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log(`SMTP connection verified for ${host}:${port}`);
} catch (error) {
  console.error(`SMTP verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}
