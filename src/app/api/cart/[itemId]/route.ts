import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }
  const body = await request.json();
  const qty = Number(body?.qty);
  await connectToDatabase();
  const cart = await Cart.findOne({ userId: user.userId });
  if (!cart) {
    return NextResponse.json({ success: false, message: 'Cart not found.' }, { status: 404 });
  }
  const item = cart.items.find((entry) => entry.bookId === params.itemId);
  if (!item) {
    return NextResponse.json({ success: false, message: 'Item not found.' }, { status: 404 });
  }
  if (!Number.isFinite(qty) || qty < 1) {
    cart.items = cart.items.filter((entry) => entry.bookId !== params.itemId);
  } else {
    item.qty = Math.min(99, qty);
    if (typeof body.savedForLater === 'boolean') item.savedForLater = body.savedForLater;
  }
  await cart.save();
  return NextResponse.json({ success: true, data: cart.items });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }
  await connectToDatabase();
  const cart = await Cart.findOneAndUpdate(
    { userId: user.userId },
    { $pull: { items: { bookId: params.itemId } } },
    { new: true }
  );
  return NextResponse.json({ success: true, data: cart?.items || [] });
}
