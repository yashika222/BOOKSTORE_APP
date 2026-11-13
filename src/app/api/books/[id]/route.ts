import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getBookById, serializeBook } from '@/services/bookService';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const book = await getBookById(params.id);
    if (!book) {
      return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: book });
  } catch (error) {
    logger.error(`Get book failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ success: false, message: 'Unable to load this book.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin privileges required.' }, { status: 403 });
  }
  const body = await request.json();
  await connectToDatabase();
  const updates: Record<string, unknown> = { ...body, pricingSource: 'admin' };
  const book =
    (await Book.findByIdAndUpdate(params.id, updates, { new: true })) ||
    (await Book.findOneAndUpdate({ sourceId: params.id }, updates, { new: true }));
  if (!book) {
    return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: serializeBook(book) });
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return PATCH(request, context);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin privileges required.' }, { status: 403 });
  }
  await connectToDatabase();
  const deleted =
    (await Book.findByIdAndDelete(params.id)) || (await Book.findOneAndDelete({ sourceId: params.id }));
  if (!deleted) {
    return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Book deleted.' });
}
