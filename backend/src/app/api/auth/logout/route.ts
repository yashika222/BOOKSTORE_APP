import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  // Clear HTTP-only cookie by setting maxAge to 0
  response.cookies.set({
    ...AUTH_COOKIE_OPTIONS,
    value: '',
    maxAge: 0,
  });

  return response;
}
