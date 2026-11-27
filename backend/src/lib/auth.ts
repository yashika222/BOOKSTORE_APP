import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';

function accessTokenTtlSeconds(): number {
  const configured = process.env.JWT_EXPIRES_IN || '15m';
  const match = /^(\d+)(s|m|h|d)$/.exec(configured.trim());
  if (!match) return 15 * 60;
  const multiplier: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  const seconds = Number(match[1]) * multiplier[match[2]];
  return Number.isSafeInteger(seconds) && seconds >= 5 * 60 && seconds <= 60 * 60
    ? seconds
    : 15 * 60;
}

const ACCESS_TOKEN_TTL_SECONDS = accessTokenTtlSeconds();
const ABSOLUTE_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  jti: string;
  iat: number;
  exp: number;
}

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signToken(
  payload: SessionUser,
  sessionId: string,
  expiresInSeconds = ACCESS_TOKEN_TTL_SECONDS
): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: expiresInSeconds,
    jwtid: sessionId,
  });
}

function verifySignedToken(token: string, allowExpired = false): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      ignoreExpiration: allowExpired,
    });
    if (
      typeof decoded === 'string' ||
      typeof decoded.jti !== 'string' ||
      typeof decoded.iat !== 'number' ||
      typeof decoded.exp !== 'number' ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.name !== 'string' ||
      (decoded.role !== 'customer' && decoded.role !== 'admin')
    ) {
      return null;
    }
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}

export function getSignedTokenFromRequest(
  request: NextRequest,
  allowExpired = false
): TokenPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifySignedToken(token, allowExpired) : null;
}

export async function createAuthSession(user: SessionUser): Promise<{
  token: string;
  expiresAt: Date;
}> {
  await connectToDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const absoluteExpiresAt = new Date(now.getTime() + ABSOLUTE_SESSION_TTL_SECONDS * 1000);
  const sessionId = crypto.randomUUID();
  const account = await User.findById(user.userId).select('+passwordChangedAt');
  if (!account) throw new Error('Cannot create a session for an unknown account.');

  await Session.create({
    userId: user.userId,
    jti: sessionId,
    expiresAt,
    absoluteExpiresAt,
    passwordVersion: account.passwordChangedAt || null,
  });

  return {
    token: signToken(user, sessionId),
    expiresAt,
  };
}

export async function extendAuthSession(
  payload: TokenPayload
): Promise<{ token: string; expiresAt: Date } | null> {
  await connectToDatabase();
  const now = new Date();
  const session = await Session.findOne({
    jti: payload.jti,
    userId: payload.userId,
    revokedAt: null,
    expiresAt: { $gt: now },
    absoluteExpiresAt: { $gt: now },
  });
  if (!session) return null;

  const expiresAt = new Date(
    Math.min(
      now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000,
      session.absoluteExpiresAt.getTime()
    )
  );
  const updated = await Session.findOneAndUpdate(
    {
      _id: session._id,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { revokedAt: now } },
    { new: true }
  );
  if (!updated) return null;

  const newSessionId = crypto.randomUUID();
  await Session.create({
    userId: updated.userId,
    jti: newSessionId,
    expiresAt,
    absoluteExpiresAt: updated.absoluteExpiresAt,
    passwordVersion: updated.passwordVersion,
  });

  return {
    token: signToken(
      {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
      newSessionId,
      Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    ),
    expiresAt,
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await connectToDatabase();
  await Session.updateOne(
    { jti: sessionId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await connectToDatabase();
  await Session.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function getCurrentUserFromRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  const session = getSignedTokenFromRequest(request);
  if (!session) return null;

  await connectToDatabase();
  const [activeSession, user] = await Promise.all([
    Session.findOne({
      jti: session.jti,
      userId: session.userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select('_id passwordVersion'),
    User.findById(session.userId).select('_id email name role passwordChangedAt'),
  ]);
  if (!activeSession || !user) return null;

  const activeVersion = activeSession.passwordVersion?.getTime() || 0;
  const currentVersion = user.passwordChangedAt?.getTime() || 0;
  if (activeVersion !== currentVersion) {
    await Session.updateOne(
      { jti: session.jti, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    return null;
  }

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    jti: session.jti,
    iat: session.iat,
    exp: session.exp,
  };
}

export const AUTH_COOKIE_NAME = 'bookstore_token';
const isProduction = process.env.NODE_ENV === 'production';

export function crossSiteCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge,
  };
}

export function authCookieOptions(expiresAt: Date) {
  return {
    name: AUTH_COOKIE_NAME,
    ...crossSiteCookieOptions(
      Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    ),
  };
}
