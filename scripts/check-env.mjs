import { readFileSync, existsSync } from 'fs';

const path = '.env.local';
if (!existsSync(path)) {
  console.log('.env.local missing');
  process.exit(0);
}
const text = readFileSync(path, 'utf8');
const keys = [
  'MONGODB_URI',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'EMAIL_FROM',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];
for (const key of keys) {
  const match = text.match(new RegExp(`^${key}=(.*)`, 'm'));
  if (!match) {
    console.log(`${key}: MISSING`);
    continue;
  }
  const value = match[1].trim().replace(/^['"]|['"]$/g, '');
  if (!value) {
    console.log(`${key}: EMPTY`);
    continue;
  }
  if (key === 'MONGODB_URI') {
    const db = (value.split('/').pop() || '').split('?')[0];
    console.log(`${key}: SET atlas=${value.startsWith('mongodb+srv')} db=${db}`);
  } else {
    console.log(`${key}: SET`);
  }
}
