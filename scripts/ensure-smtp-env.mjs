import { readFileSync, writeFileSync, existsSync } from 'fs';

const path = '.env.local';
if (!existsSync(path)) {
  console.log('.env.local is missing; create it from .env.example');
  process.exit(0);
}

const current = readFileSync(path, 'utf8');
const additions = [];
if (!/^SMTP_HOST=/m.test(current)) additions.push('SMTP_HOST=smtp.gmail.com');
if (!/^SMTP_PORT=/m.test(current)) additions.push('SMTP_PORT=587');
if (!/^SMTP_SECURE=/m.test(current)) additions.push('SMTP_SECURE=false');
if (!/^SMTP_USER=/m.test(current)) additions.push('SMTP_USER=');
if (!/^SMTP_PASSWORD=/m.test(current)) additions.push('SMTP_PASSWORD=');
if (!/^SMTP_FROM=/m.test(current)) additions.push('SMTP_FROM=');

if (additions.length === 0) {
  console.log('SMTP keys already present in .env.local');
  process.exit(0);
}

writeFileSync(
  path,
  `${current.trimEnd()}\n\n# Gmail SMTP — fill SMTP_USER, SMTP_PASSWORD (App Password) and SMTP_FROM\n${additions.join('\n')}\n`
);
console.log(`Added SMTP placeholders: ${additions.map((line) => line.split('=')[0]).join(', ')}`);
