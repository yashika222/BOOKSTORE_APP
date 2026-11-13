import { NextRequest, NextResponse } from 'next/server';

interface SessionPayload {
  exp?: number;
  role?: string;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return toArrayBuffer(Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)));
}

async function getValidSession(token: string): Promise<SessionPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedHeader)));
    if (header.alg !== 'HS256') return null;

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload))
    ) as SessionPayload;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;

    const key = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(new TextEncoder().encode(secret)),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(encodedSignature),
      toArrayBuffer(new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`))
    );

    return valid ? payload : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('bookstore_token')?.value;
  const session = token ? await getValidSession(token) : null;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    const nextPath =
      pathname === '/checkout' || pathname.startsWith('/checkout/')
        ? '/cart'
        : `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/home?forbidden=admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/orders/:path*',
    '/account/:path*',
    '/admin/:path*',
  ],
};
