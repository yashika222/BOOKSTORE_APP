import crypto from 'crypto';

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function createResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}
