import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { listBooks, serializeBook } from '@/services/bookService';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const category = searchParams.get('category')?.trim() || searchParams.get('genre')?.trim() || '';
  const author = searchParams.get('author')?.trim() || '';
  const sort = searchParams.get('sort')?.trim() || searchParams.get('sortBy')?.trim() || 'popular';
  const sortOrder = searchParams.get('sortOrder')?.trim() || '';
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || searchParams.get('pageSize') || '20');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const language = searchParams.get('language')?.trim() || '';
  const availability = searchParams.get('availability')?.trim() || '';

  if (search.length > 120 || category.length > 80) {
    return NextResponse.json({ success: false, message: 'Filters are too long.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const result = await listBooks({
      page,
      limit,
      search,
      category,
      author,
      sort,
      sortBy: sort,
      sortOrder,
      language,
      availability,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      count: result.data.length,
    });
  } catch (error) {
    logger.error(`Book list failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to load books from the store database.' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    if (!title || !author) {
      return NextResponse.json({ success: false, message: 'Title and author are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const sourceId = `admin-${Date.now()}`;
    const book = await Book.create({
      source: 'admin',
      sourceId,
      title,
      author,
      authors: [{ name: author }],
      description: typeof body.description === 'string' ? body.description : '',
      isbn: typeof body.isbn === 'string' && body.isbn.trim() ? body.isbn.trim() : undefined,
      price: typeof body.price === 'number' ? body.price : undefined,
      originalPrice: typeof body.originalPrice === 'number' ? body.originalPrice : undefined,
      stock: typeof body.stock === 'number' ? body.stock : 0,
      genre: typeof body.genre === 'string' ? body.genre : '',
      coverImage: typeof body.coverImage === 'string' ? body.coverImage : '',
      rating: typeof body.rating === 'number' ? body.rating : undefined,
      pricingSource: 'admin',
      subjects: typeof body.genre === 'string' ? [body.genre] : [],
    });

    return NextResponse.json({ success: true, data: serializeBook(book) }, { status: 201 });
  } catch (error) {
    logger.error(`Create book failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ success: false, message: 'Unable to create book.' }, { status: 500 });
  }
}
