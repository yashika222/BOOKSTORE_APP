import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Wishlist from '@/models/Wishlist';
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

  await connectToDatabase();
  const wishlist = await Wishlist.findOne({ userId: user.userId });
  return NextResponse.json({
    success: true,
    data: Array.from(new Set(wishlist?.bookIds || [])),
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

  const body = await request.json();
  const bookId = typeof body?.bookId === 'string' ? body.bookId : null;
  const bookIds = Array.isArray(body?.bookIds) ? body.bookIds.filter((id: unknown) => typeof id === 'string') : null;

  await connectToDatabase();
  const existing = await Wishlist.findOne({ userId: user.userId });
  const unique = new Set(existing?.bookIds || []);
  if (bookId) unique.add(bookId);
  if (bookIds) {
    unique.clear();
    bookIds.forEach((id: string) => unique.add(id));
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { userId: user.userId },
    { userId: user.userId, bookIds: Array.from(unique) },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true, data: wishlist.bookIds });
}
