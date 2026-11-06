import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Please log in to access your wishlist.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Wishlist access verified.',
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Please log in to add books to your wishlist.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Wishlist changes are stored for this signed-in account on this device.',
  });
}
