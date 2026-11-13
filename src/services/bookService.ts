import Book, { IBookDocument } from '@/models/Book';
import { categoriesFromSubjects } from '@/lib/normalizeCategory';
import { pickCoverSource, proxiedCoverUrl } from '@/lib/coverUrl';
import { catalogPageSize } from '@/lib/catalogPagination';

export { catalogPageSize, DEFAULT_BOOK_PAGE_SIZE, MAX_BOOK_PAGE_SIZE } from '@/lib/catalogPagination';

export interface BookListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  sortBy?: string;
  sortOrder?: string;
  language?: string;
  availability?: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function serializeBook(book: IBookDocument) {
  const authors = book.authors?.length
    ? book.authors
    : [{ name: book.author || 'Unknown Author' }];
  return {
    _id: book._id.toString(),
    id: book._id.toString(),
    source: book.source,
    sourceId: book.sourceId,
    title: book.title,
    authors,
    author: book.author || authors[0]?.name || 'Unknown Author',
    subjects: book.subjects || [],
    languages: book.languages || ['en'],
    coverImage: proxiedCoverUrl(
      pickCoverSource({
        coverImage: book.coverImage,
        formats: book.formats,
        sourceId: book.sourceId,
      })
    ),
    category: book.category || book.genre || categoriesFromSubjects(book.subjects)[0] || '',
    formats: book.formats || {},
    downloadCount: book.downloadCount || 0,
    isbn: book.isbn,
    description: book.description || '',
    publisher: book.publisher || '',
    price: book.price,
    originalPrice: book.originalPrice,
    stock: book.stock ?? 0,
    rating: book.rating,
    reviewCount: book.reviewCount || 0,
    pricingSource: book.pricingSource,
    genre: book.genre || categoriesFromSubjects(book.subjects)[0] || '',
    featured: Boolean(book.featured),
  };
}

export async function listBooks(query: BookListQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = catalogPageSize(query.limit);
  const search = query.search?.trim() || '';
  const category = query.category?.trim() || '';
  const author = query.author?.trim() || '';
  const language = query.language?.trim() || '';
  const sortBy = query.sortBy || query.sort || 'popular';
  const sortOrder = query.sortOrder === 'asc' ? 1 : query.sortOrder === 'desc' ? -1 : undefined;

  const filter: Record<string, unknown> = {};
  if (search) {
    const rx = escapeRegex(search);
    filter.$or = [
      { title: { $regex: rx, $options: 'i' } },
      { author: { $regex: rx, $options: 'i' } },
      { isbn: { $regex: rx, $options: 'i' } },
      { 'authors.name': { $regex: rx, $options: 'i' } },
    ];
  }
  if (category && category.toLowerCase() !== 'all') {
    filter.$and = [
      ...((filter.$and as unknown[]) || []),
      {
        $or: [
          { category: { $regex: escapeRegex(category), $options: 'i' } },
          { genre: { $regex: escapeRegex(category), $options: 'i' } },
          { subjects: { $regex: escapeRegex(category), $options: 'i' } },
        ],
      },
    ];
  }
  if (author) {
    filter.author = { $regex: escapeRegex(author), $options: 'i' };
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }
  if (language) {
    filter.languages = language.toLowerCase();
  }
  if (query.availability === 'in-stock') {
    filter.stock = { $gt: 0 };
  }

  let sort: Record<string, 1 | -1> =
    sortBy === 'price-asc' || sortBy === 'price'
      ? { price: sortOrder || 1 }
      : sortBy === 'price-desc'
        ? { price: -1 }
        : sortBy === 'rating'
          ? { rating: sortOrder || -1 }
          : sortBy === 'title'
            ? { title: sortOrder || 1 }
            : { downloadCount: -1, createdAt: -1, _id: 1 };
  if (sortBy === 'price' && sortOrder) sort = { price: sortOrder };
  if (sortBy === 'popular' && sortOrder) sort = { downloadCount: sortOrder };

  const total = await Book.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(page, totalPages);
  const docs = await Book.find(filter)
    .sort(sort)
    .skip((safePage - 1) * limit)
    .limit(limit);

  return {
    data: docs.map(serializeBook),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function getBookById(id: string) {
  if (/^\d+$/.test(id)) {
    const bySource = await Book.findOne({ sourceId: id });
    if (bySource) return serializeBook(bySource);
  }
  if (id.match(/^[a-fA-F0-9]{24}$/)) {
    const byId = await Book.findById(id);
    if (byId) return serializeBook(byId);
  }
  const byIsbn = await Book.findOne({ isbn: id });
  return byIsbn ? serializeBook(byIsbn) : null;
}
