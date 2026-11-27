import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Password reset now uses an email link. Request a new reset link to continue.',
    },
    { status: 410 }
  );
}
