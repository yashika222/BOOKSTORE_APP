import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Server-side Cart Endpoint
 * In this application, Redux Toolkit + localStorage manages the active client-side cart.
 * The cart is stored in browser state and is not synchronized to the server.
 */

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Please log in to access your cart.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    userEmail: user.email,
    message: 'Cart access verified.',
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Please log in to access your cart.' },
      { status: 401 }
    );
  }
  const body = await request.json();
  if (!Array.isArray(body?.items)) {
    return NextResponse.json(
      { success: false, message: 'Cart items must be provided as an array.' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: 'Server-side cart synchronization is not available. Your cart is stored in this browser.',
    },
    { status: 501 }
  );
}
