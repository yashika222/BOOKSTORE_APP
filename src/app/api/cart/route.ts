import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Please log in to access your cart.' },
      { status: 401 }
    );
  }

  await connectToDatabase();
  const cart = await Cart.findOne({ userId: user.userId });
  return NextResponse.json({
    success: true,
    data: cart?.items || [],
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

  const items = body.items
    .filter((item: { bookId?: unknown; qty?: unknown }) => typeof item?.bookId === 'string' && Number(item.qty) > 0)
    .map((item: { bookId: string; qty: number; savedForLater?: boolean }) => ({
      bookId: item.bookId,
      qty: Math.min(99, Math.max(1, Number(item.qty))),
      savedForLater: Boolean(item.savedForLater),
    }));

  await connectToDatabase();
  const cart = await Cart.findOneAndUpdate(
    { userId: user.userId },
    { userId: user.userId, items },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true, data: cart.items });
}
