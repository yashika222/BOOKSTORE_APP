import Book from '@/models/Book';
import logger from '@/lib/logger';
import { buildCatalogBooks, CATALOG_TARGET_COUNT } from '@/lib/catalogSeed';

let seedPromise: Promise<number> | null = null;

export async function ensureCatalogSeeded(target = CATALOG_TARGET_COUNT): Promise<number> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const existingCount = await Book.countDocuments();
    if (existingCount >= target) {
      return existingCount;
    }

    logger.info(`Seeding bookstore catalog: ${existingCount} books present, targeting ${target}.`);

    const catalog = buildCatalogBooks(target);
    const existing = await Book.find({}, 'isbn').lean();
    const existingIsbns = new Set(existing.map((book) => book.isbn));
    const missing = catalog
      .filter((book) => !existingIsbns.has(book.isbn))
      .slice(0, Math.max(0, target - existingCount))
      .map((book) => ({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        description: book.description,
        price: book.price,
        stock: book.stock,
        genre: book.genre,
        rating: book.rating ?? 4.5,
        coverImage: book.coverImage || '',
        featured: Boolean(book.featured),
        publishedYear: book.publishedYear || new Date().getFullYear(),
      }));

    for (let index = 0; index < missing.length; index += 200) {
      const batch = missing.slice(index, index + 200);
      try {
        await Book.insertMany(batch, { ordered: false });
      } catch (error) {
        logger.warn(`Catalog seed batch starting at ${index} reported: ${error}`);
      }
    }

    const nextCount = await Book.countDocuments();
    logger.info(`Bookstore catalog now contains ${nextCount} books.`);
    return nextCount;
  })();

  try {
    return await seedPromise;
  } catch (error) {
    seedPromise = null;
    throw error;
  }
}
