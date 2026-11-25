import { NextRequest, NextResponse } from 'next/server';

/**
 * Frontend page-level gate only. The backend HTTP-only JWT remains authoritative
 * for every API call; this non-sensitive hint cookie merely preserves the
 * existing redirect behaviour for protected pages across separate origins.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionHint = request.cookies.get('bookstore_session')?.value;
  const roleHint = request.cookies.get('bookstore_role')?.value;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (!sessionHint) {
    const loginUrl = new URL('/login', request.url);
    const nextPath =
      pathname === '/checkout' || pathname.startsWith('/checkout/')
        ? '/cart'
        : `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && roleHint !== 'admin') {
    return NextResponse.redirect(new URL('/home?forbidden=admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*', '/account/:path*', '/admin/:path*'],
};
