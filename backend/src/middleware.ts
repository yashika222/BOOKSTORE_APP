import { NextRequest, NextResponse } from 'next/server';
import { getAllowedOrigins } from '@/lib/appUrls';

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowed = origin ? getAllowedOrigins().includes(origin) : false;

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? corsHeaders(origin) : { Vary: 'Origin' },
    });
  }

  const response = NextResponse.next();
  if (allowed) {
    for (const [name, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(name, value);
    }
  } else {
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
