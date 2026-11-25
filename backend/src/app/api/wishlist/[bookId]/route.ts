import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Wishlist from '@/models/Wishlist';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }

  await connectToDatabase();
  const wishlist = await Wishlist.findOneAndUpdate(
    { userId: user.userId },
    { $pull: { bookIds: params.bookId } },
    { new: true }
  );

  return NextResponse.json({ success: true, data: wishlist?.bookIds || [] });
}
