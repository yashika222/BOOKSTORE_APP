import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User, { RecentlyViewedBook } from '@/models/User';
import { getCurrentUserFromRequest } from '@/lib/auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const MAX_RECENT = 8;

export async function GET(request: NextRequest) {
  const session = await getCurrentUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.userId).select('recentlyViewed');
    return NextResponse.json({
      success: true,
      data: user?.recentlyViewed || [],
    });
  } catch (error) {
    logger.warn(`Recently viewed lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Please log in.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bookId = typeof body?.bookId === 'string' || typeof body?.bookId === 'number' ? String(body.bookId) : '';
    const source: 'store' | 'gutendex' | null =
      body?.source === 'store' ? 'store' : body?.source === 'gutendex' ? 'gutendex' : null;
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 200) : '';
    const author = typeof body?.author === 'string' ? body.author.trim().slice(0, 200) : 'Unknown Author';
    const coverImage = typeof body?.coverImage === 'string' ? body.coverImage.slice(0, 2048) : '';

    if (!bookId || !source || !title) {
      return NextResponse.json(
        { success: false, message: 'A valid book reference is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    const next: RecentlyViewedBook[] = [
      { bookId, source, title, author, coverImage, viewedAt: new Date() },
      ...user.recentlyViewed.filter(
        (item: RecentlyViewedBook) => !(item.bookId === bookId && item.source === source)
      ),
    ].slice(0, MAX_RECENT);

    user.recentlyViewed = next;
    await user.save();

    return NextResponse.json({ success: true, data: next });
  } catch (error) {
    logger.warn(`Recently viewed save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ success: true, data: [] });
  }
}
