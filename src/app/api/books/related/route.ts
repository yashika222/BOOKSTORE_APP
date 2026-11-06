import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source');
  const id = request.nextUrl.searchParams.get('id') || '';
  const topic = request.nextUrl.searchParams.get('topic') || '';
  const genre = request.nextUrl.searchParams.get('genre') || '';

  try {
    if (source === 'gutendex') {
      const url = new URL('https://gutendex.com/books/');
      url.searchParams.set('languages', 'en');
      if (topic) url.searchParams.set('topic', topic);
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return NextResponse.json({ success: true, data: [] });
      }
      const payload = await response.json();
      const results = Array.isArray(payload.results) ? payload.results : [];
      return NextResponse.json({
        success: true,
        data: results.filter((book: { id: number }) => String(book.id) !== String(id)).slice(0, 4),
      });
    }

    await connectToDatabase();
    const query = genre
      ? { genre: { $regex: genre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      : {};
    const books = await Book.find(query).limit(8);
    return NextResponse.json({
      success: true,
      data: books.filter((book) => book._id.toString() !== id && book.isbn !== id).slice(0, 4),
    });
  } catch (error) {
    logger.warn(`Related books lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ success: true, data: [] });
  }
}
