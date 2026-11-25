import { readFileSync, existsSync } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Book from '../models/Book';
import { categoriesFromSubjects } from '../lib/normalizeCategory';

const TARGET_COUNT = 1000;
const START_URL = 'https://gutendex.com/books/';

function loadEnvFile(fileName: string) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function demoStorefront(sourceId: number) {
  const price = 149 + (sourceId % 23) * 30;
  const originalPrice = Math.round(price * 1.35);
  const stock = 4 + (sourceId % 36);
  const rating = Math.min(5, Math.round((3.6 + (sourceId % 14) * 0.1) * 10) / 10);
  return { price, originalPrice, stock, rating, reviewCount: sourceId % 180 };
}

async function fetchPage(url: string, attempt = 1): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Gutendex responded ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (attempt >= 4) throw error;
    const delay = attempt * 1500;
    console.warn(`Retry ${attempt} for ${url} in ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchPage(url, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required. Add it to .env.local');
  }

  await mongoose.connect(uri);
  console.log(`Connected to ${uri.startsWith('mongodb+srv') ? 'MongoDB Atlas' : 'local MongoDB'}`);

  try {
    await Book.collection.dropIndex('isbn_1');
    console.log('Dropped legacy unique isbn index');
  } catch {
    // Index may not exist.
  }

  const removedLegacy = await Book.deleteMany({
    $or: [{ sourceId: { $exists: false } }, { sourceId: null }, { sourceId: '' }],
  });
  console.log(`Removed ${removedLegacy.deletedCount} legacy books without Gutendex sourceId`);

  const unique = new Map<number, any>();
  let nextUrl: string | null = START_URL;
  let page = 0;

  while (nextUrl && unique.size < TARGET_COUNT) {
    page += 1;
    console.log(`Fetching Gutendex page ${page}: ${nextUrl}`);
    const payload = await fetchPage(nextUrl);
    const results = Array.isArray(payload?.results) ? payload.results : [];
    for (const book of results) {
      if (unique.size >= TARGET_COUNT) break;
      const id = Number(book.id);
      if (!Number.isFinite(id) || unique.has(id)) continue;
      unique.set(id, book);
    }
    nextUrl = typeof payload?.next === 'string' ? payload.next : null;
    console.log(`Collected ${unique.size}/${TARGET_COUNT} unique books`);
  }

  if (unique.size < TARGET_COUNT) {
    throw new Error(`Only collected ${unique.size} unique books from Gutendex`);
  }

  const operations = Array.from(unique.values()).slice(0, TARGET_COUNT).map((book) => {
    const authors = Array.isArray(book.authors) ? book.authors : [];
    const author = authors.map((item: { name?: string }) => item.name).filter(Boolean).join(', ') || 'Unknown Author';
    const subjects = Array.isArray(book.subjects) ? book.subjects : [];
    const coverImage = book.formats?.['image/jpeg'] || book.formats?.['image/png'] || '';
    const storefront = demoStorefront(Number(book.id));
    const summary = Array.isArray(book.summaries) ? book.summaries.join('\n\n') : '';
    return {
      updateOne: {
        filter: { sourceId: String(book.id) },
        update: {
          $set: {
            source: 'gutendex' as const,
            sourceId: String(book.id),
            title: String(book.title || 'Untitled').slice(0, 500),
            authors,
            author,
            subjects,
            languages: Array.isArray(book.languages) ? book.languages : ['en'],
            coverImage,
            formats: book.formats || {},
            downloadCount: Number(book.download_count) || 0,
            description: summary,
            genre: categoriesFromSubjects(subjects)[0] || '',
            category: categoriesFromSubjects(subjects)[0] || '',
            pricingSource: 'demo' as const,
            ...storefront,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Book.bulkWrite(operations, { ordered: false });
  const count = await Book.countDocuments({ source: 'gutendex' });
  const distinct = await Book.distinct('sourceId', { source: 'gutendex' });
  const withTitle = await Book.countDocuments({ source: 'gutendex', title: { $nin: [null, ''] } });
  const withAuthor = await Book.countDocuments({ source: 'gutendex', author: { $nin: [null, '', 'Unknown Author'] } });
  const withCover = await Book.countDocuments({ source: 'gutendex', coverImage: { $nin: [null, ''] } });
  console.log(`Bulk write matched=${result.matchedCount} upserted=${result.upsertedCount} modified=${result.modifiedCount}`);
  console.log(`Gutendex books in MongoDB: ${count}`);
  console.log(`Unique sourceIds: ${distinct.length}`);
  console.log(`Records with title: ${withTitle}`);
  console.log(`Records with author: ${withAuthor}`);
  console.log(`Records with coverImage: ${withCover}`);

  if (distinct.length < TARGET_COUNT) {
    throw new Error('Import finished below the 1000 unique-record target');
  }

  await mongoose.disconnect();
  console.log('Import complete');
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
