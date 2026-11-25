import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

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
}

/**
 * Hash plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password against bcrypt hashed password
 */
export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

/**
 * Sign JWT token for authenticated user session
 */
export function signToken(payload: TokenPayload, expiresIn: jwt.SignOptions['expiresIn'] = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

/**
 * Verify JWT token string and return decoded payload or null
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user session from incoming NextRequest
 * Looks for HTTP-only cookie 'bookstore_token' first, then 'Authorization: Bearer' header
 */
export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  // 1. Try reading HTTP-only cookie
  const cookieToken = request.cookies.get('bookstore_token')?.value;
  if (cookieToken) {
    const verified = verifyToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Try reading Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7);
    return verifyToken(headerToken);
  }

  return null;
}

export async function getCurrentUserFromRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  const session = getUserFromRequest(request);
  if (!session) return null;

  try {
    await connectToDatabase();
    const user = await User.findById(session.userId).select('_id email name role');
    if (!user) {
      // Return verified JWT session in fallback/demo mode
      return session;
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch {
    // If DB is offline, return verified JWT session
    return session;
  }
}

/**
 * Cookie options for setting secure HTTP-only cookies
 */
export const AUTH_COOKIE_NAME = 'bookstore_token';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cross-site cookies (frontend and backend on different origins) must use
 * SameSite=None + Secure in production. Localhost ports are same-site, so Lax
 * keeps local development simple while still requiring credentialed CORS.
 */
export function crossSiteCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge,
  };
}

export const AUTH_COOKIE_OPTIONS = {
  name: AUTH_COOKIE_NAME,
  ...crossSiteCookieOptions(60 * 60 * 24 * 7), // 7 days in seconds
};
