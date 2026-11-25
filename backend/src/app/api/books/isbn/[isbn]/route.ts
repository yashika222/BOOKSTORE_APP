import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getBookById } from '@/services/bookService';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { isbn: string } }
) {
  await connectToDatabase();
  const book = await getBookById(params.isbn);
  if (!book) {
    return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: book });
}
