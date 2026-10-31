import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import { getUserFromRequest } from '@/lib/auth';
import { SAMPLE_COMMERCIAL_BOOKS } from '@/lib/sampleBooks';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/books - List all commercial books with filters
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Auto-seed sample commercial books if collection is empty
    const count = await Book.countDocuments();
    if (count === 0) {
      logger.info('Auto-seeding initial commercial bookstore inventory...');
      await Book.insertMany(
        SAMPLE_COMMERCIAL_BOOKS.map((b) => ({
          isbn: b.isbn,
          title: b.title,
          author: b.author,
          description: b.description,
          price: b.price,
          stock: b.stock,
          genre: b.genre,
          rating: b.rating,
          coverImage: b.coverImage,
          featured: b.featured,
          publishedYear: b.publishedYear,
        }))
      );
    }

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre && genre !== 'all') {
      query.genre = { $regex: genre, $options: 'i' };
    }

    const books = await Book.find(query).sort({ featured: -1, createdAt: -1 }).limit(limit);

    return NextResponse.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error: any) {
    logger.error(`Error fetching books: ${error.message}`);
    // If database connection fails, return sample books fallback
    return NextResponse.json({
      success: true,
      count: SAMPLE_COMMERCIAL_BOOKS.length,
      data: SAMPLE_COMMERCIAL_BOOKS,
      warning: 'Operating on in-memory dataset (MongoDB offline or unconfigured)',
    });
  }
}

// POST /api/books - Create new commercial book (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    // Verify Admin Authorization
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await request.json();
    const { isbn, title, author, description, price, stock, genre, coverImage, rating } = body;

    // Validate inputs
    if (!isbn || !title || !author || price === undefined || stock === undefined || !genre) {
      return NextResponse.json(
        { success: false, message: 'Please fill all required book fields: ISBN, Title, Author, Price, Stock, Genre.' },
        { status: 400 }
      );
    }

    // Check for duplicate ISBN
    const existingBook = await Book.findOne({ isbn: isbn.trim() });
    if (existingBook) {
      return NextResponse.json(
        { success: false, message: `A book with ISBN "${isbn}" already exists in the catalog.` },
        { status: 409 }
      );
    }

    const newBook = await Book.create({
      isbn: isbn.trim(),
      title: title.trim(),
      author: author.trim(),
      description: description?.trim() || '',
      price: Number(price),
      stock: Number(stock),
      genre: genre.trim(),
      rating: rating ? Number(rating) : 4.5,
      coverImage: coverImage?.trim() || '',
      featured: Boolean(body.featured),
      publishedYear: body.publishedYear ? Number(body.publishedYear) : new Date().getFullYear(),
    });

    logger.info(`Admin created new commercial book: "${newBook.title}" (ISBN: ${newBook.isbn})`);

    return NextResponse.json(
      {
        success: true,
        message: 'Book created successfully in commercial catalog.',
        data: newBook,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error(`Error creating book: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create book record' },
      { status: 500 }
    );
  }
}
