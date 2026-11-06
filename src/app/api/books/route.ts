import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Book from '@/models/Book';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { buildCatalogBooks, BOOK_PAGE_SIZE, CATALOG_TARGET_COUNT } from '@/lib/catalogSeed';
import { ensureCatalogSeeded } from '@/lib/ensureCatalog';
import logger from '@/lib/logger';
import { ICommercialBook } from '@/types';
import { commercialGenreFromCategory } from '@/lib/gutendexCatalog';

export const dynamic = 'force-dynamic';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginateList(
  list: ICommercialBook[],
  page: number,
  pageSize: number
): { data: ICommercialBook[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    data: list.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function filterGeneratedBooks(options: {
  search: string;
  genre: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  sortBy: string;
}): ICommercialBook[] {
  const search = options.search.toLowerCase();
  const genre = options.genre.toLowerCase();
  let list = buildCatalogBooks(CATALOG_TARGET_COUNT).filter((book) => {
    const matchesQuery =
      !search ||
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search) ||
      book.isbn.toLowerCase().includes(search);
    const matchesGenre = !genre || genre === 'all' || book.genre.toLowerCase().includes(genre);
    const matchesPrice =
      (options.minPrice === undefined || book.price >= options.minPrice) &&
      (options.maxPrice === undefined || book.price <= options.maxPrice);
    const matchesStock = !options.inStockOnly || book.stock > 0;
    return matchesQuery && matchesGenre && matchesPrice && matchesStock;
  });

  list = [...list];
  if (options.sortBy === 'title-desc') list.sort((a, b) => b.title.localeCompare(a.title));
  else if (options.sortBy === 'title' || options.sortBy === 'title-asc') list.sort((a, b) => a.title.localeCompare(b.title));
  else if (options.sortBy === 'author') list.sort((a, b) => a.author.localeCompare(b.author));
  else if (options.sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (options.sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (options.sortBy === 'in-stock') list.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
  else list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.rating || 0) - (a.rating || 0));
  return list;
}

function jsonPage(
  payload: { data: ICommercialBook[]; total: number; page: number; pageSize: number; totalPages: number },
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({
    success: true,
    ...payload,
    count: payload.data.length,
    hasNext: payload.page < payload.totalPages,
    hasPrev: payload.page > 1,
    ...extra,
  });
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSearch = searchParams.get('search')?.trim() || '';
  const rawGenre = commercialGenreFromCategory(searchParams.get('genre')?.trim() || '') || searchParams.get('genre')?.trim() || '';
  const sortBy = searchParams.get('sort')?.trim() || 'popular';
  const rawPage = Number(searchParams.get('page') || '1');
  const rawLimit = searchParams.get('limit');
  const rawPageSize = Number(searchParams.get('pageSize') || rawLimit || String(BOOK_PAGE_SIZE));
  const minPrice = parseOptionalNumber(searchParams.get('minPrice'));
  const maxPrice = parseOptionalNumber(searchParams.get('maxPrice'));
  const inStockOnly = searchParams.get('inStock') === 'true' || sortBy === 'in-stock';

  if (rawSearch.length > 100 || rawGenre.length > 80) {
    return NextResponse.json(
      { success: false, message: 'Search and genre filters are too long.' },
      { status: 400 }
    );
  }

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    return NextResponse.json({ success: false, message: 'Page must be a positive integer.' }, { status: 400 });
  }

  if (!Number.isInteger(rawPageSize) || rawPageSize < 1 || rawPageSize > 1000) {
    return NextResponse.json(
      { success: false, message: 'Page size must be an integer between 1 and 1000.' },
      { status: 400 }
    );
  }

  const filterOptions = {
    search: rawSearch,
    genre: rawGenre,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
  };

  try {
    await connectToDatabase();
    await ensureCatalogSeeded();

    const query: Record<string, unknown> = {};
    if (rawSearch) {
      const search = escapeRegex(rawSearch);
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    if (rawGenre && rawGenre.toLowerCase() !== 'all') {
      query.genre = { $regex: escapeRegex(rawGenre), $options: 'i' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      };
    }

    if (inStockOnly) {
      query.stock = { $gt: 0 };
    }

    const sort: Record<string, 1 | -1> =
      sortBy === 'title-desc'
        ? { title: -1 }
        : sortBy === 'title' || sortBy === 'title-asc'
          ? { title: 1 }
          : sortBy === 'author'
            ? { author: 1 }
            : sortBy === 'price-asc'
              ? { price: 1 }
              : sortBy === 'price-desc'
                ? { price: -1 }
                : sortBy === 'in-stock'
                  ? { stock: -1, featured: -1 }
                  : { featured: -1, rating: -1, createdAt: -1 };

    const total = await Book.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / rawPageSize) || 1);
    const page = Math.min(rawPage, totalPages);
    const books = await Book.find(query)
      .sort(sort)
      .skip((page - 1) * rawPageSize)
      .limit(rawPageSize);

    return jsonPage({
      data: books as unknown as ICommercialBook[],
      total,
      page,
      pageSize: rawPageSize,
      totalPages,
    });
  } catch (error) {
    logger.warn(
      `Database unavailable for commercial books; serving generated catalog: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    const fallback = paginateList(filterGeneratedBooks(filterOptions), rawPage, rawPageSize);
    return jsonPage(fallback, {
      fallback: true,
      warning: 'The store database is unavailable. Showing a generated catalog until MongoDB is connected.',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: 'A valid book object is required.' },
        { status: 400 }
      );
    }
    const values = body as Record<string, unknown>;
    const { isbn, title, author, description, price, stock, genre, coverImage, rating } = values;

    if (
      typeof isbn !== 'string' || !isbn.trim() ||
      isbn.length > 200 ||
      typeof title !== 'string' || !title.trim() ||
      title.length > 200 ||
      typeof author !== 'string' || !author.trim() ||
      author.length > 200 ||
      typeof genre !== 'string' || !genre.trim() ||
      genre.length > 200 ||
      typeof price !== 'number' || !Number.isFinite(price) || price < 0 ||
      typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0 ||
      (description !== undefined &&
        (typeof description !== 'string' || description.length > 5000)) ||
      (coverImage !== undefined &&
        (typeof coverImage !== 'string' || coverImage.length > 2048)) ||
      (values.featured !== undefined && typeof values.featured !== 'boolean') ||
      (values.publishedYear !== undefined &&
        (typeof values.publishedYear !== 'number' ||
          !Number.isInteger(values.publishedYear) ||
          values.publishedYear < 0 ||
          values.publishedYear > 3000)) ||
      (rating !== undefined &&
        (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 0 || rating > 5))
    ) {
      return NextResponse.json(
        { success: false, message: 'Provide valid ISBN, title, author, genre, non-negative price and stock, and an optional rating from 0 to 5.' },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();

      const existingBook = await Book.findOne({ isbn: isbn.trim() });
      if (existingBook) {
        return NextResponse.json(
          { success: false, message: 'A book with this ISBN already exists.' },
          { status: 409 }
        );
      }

      const newBook = await Book.create({
        isbn: isbn.trim(),
        title: title.trim(),
        author: author.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        price,
        stock,
        genre: genre.trim(),
        rating: typeof rating === 'number' ? rating : 4.5,
        coverImage: typeof coverImage === 'string' ? coverImage.trim() : '',
        featured: values.featured === true,
        publishedYear:
          typeof values.publishedYear === 'number' && Number.isInteger(values.publishedYear)
            ? values.publishedYear
            : new Date().getFullYear(),
      });

      logger.info(`Admin created new commercial book: "${newBook.title}" (ISBN: ${newBook.isbn})`);

      return NextResponse.json(
        {
          success: true,
          message: 'Book created successfully',
          data: newBook,
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      if (dbErr?.code === 11000) {
        return NextResponse.json(
          { success: false, message: 'A book with this ISBN already exists.' },
          { status: 409 }
        );
      }

      logger.warn(`Database creation failed: ${dbErr}`);
      return NextResponse.json(
        { success: false, message: 'Unable to save this book because the database is unavailable.' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    logger.error(`Error creating book: ${error.message}`);
    return NextResponse.json(
      { success: false, message: 'Failed to create book record.' },
      { status: 500 }
    );
  }
}
