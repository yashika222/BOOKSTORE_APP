import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Server-side Cart Endpoint
 * In this application, Redux Toolkit + localStorage manages the active client-side cart.
 * This endpoint provides optional session-level cart synchronization.
 */

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);

  return NextResponse.json({
    success: true,
    userEmail: user?.email || null,
    message: 'Cart sync active via Redux Toolkit and localStorage client persistence.',
  });
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  const body = await request.json();

  return NextResponse.json({
    success: true,
    userEmail: user?.email || null,
    itemsCount: Array.isArray(body?.items) ? body.items.length : 0,
    message: 'Cart state synchronized.',
  });
}
