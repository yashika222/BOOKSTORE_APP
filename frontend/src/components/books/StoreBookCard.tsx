'use client';

import Link from 'next/link';
import BookCoverImage from '@/components/books/BookCoverImage';
import { formatCurrency } from '@/lib/currency';

export interface StoreBook {
  _id?: string;
  id?: string;
  sourceId?: string;
  title?: string;
  author?: string;
  authors?: { name?: string }[];
  coverImage?: string;
  formats?: Record<string, string>;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  pricingSource?: string;
}

function bookAuthor(book: StoreBook): string {
  if (book.author?.trim()) return book.author;
  const names = (book.authors || []).map((item) => item?.name).filter(Boolean) as string[];
  return names.join(', ') || 'Unknown Author';
}

export default function StoreBookCard({
  book,
  imageLoading = 'lazy',
}: {
  book: StoreBook;
  imageLoading?: 'eager' | 'lazy';
  wishlisted?: boolean;
  onToggleWishlist?: () => void;
  onAddToCart?: () => void;
}) {
  const id = book._id || book.id || book.sourceId;
  const title = book.title?.trim() || 'Untitled';
  const author = bookAuthor(book);
  const inStock = typeof book.stock !== 'number' || book.stock > 0;
  const reviews = book.reviewCount || 20;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[4px] border-[1px] border-solid border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md">
      <Link
        href={`/books/${id}`}
        className="relative flex h-[172px] shrink-0 items-center justify-center bg-[#f4f4f4]"
        aria-label={`View details for ${title}`}
      >
        <BookCoverImage
          src={book.coverImage || book.formats?.['image/jpeg'] || book.formats?.['image/png'] || (book.sourceId && /^\d+$/.test(book.sourceId) ? `https://www.gutenberg.org/cache/epub/${book.sourceId}/pg${book.sourceId}.cover.medium.jpg` : undefined)}
          title={title}
          author={author}
          loading={imageLoading}
          className="relative z-0 h-[136px] w-[104px] rounded-none object-contain p-0 shadow-none"
        />
        {!inStock ? (
          <>
            <span className="pointer-events-none absolute inset-0 z-10 bg-black/10" />
            <span className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-8 py-2 text-[14px] font-medium uppercase text-[#333] shadow">
              OUT OF STOCK
            </span>
          </>
        ) : (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden bg-black/70 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white group-hover:block">
            QUICK VIEW
          </span>
        )}
      </Link>
      <div className="flex min-h-[84px] flex-col px-4 py-[9px]">
        <Link
          href={`/books/${id}`}
          className="w-full truncate text-left text-[14px] font-medium leading-5 text-[#333]"
          title={title}
        >
          {title}
        </Link>
        <p className="m-0 w-full truncate text-[11px] leading-[14px] text-[var(--muted)]">by {author}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] leading-4">
          {typeof book.rating === 'number' ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--rating)] px-1 py-px font-semibold text-white">
              {book.rating.toFixed(1)} ★
            </span>
          ) : null}
          <span className="text-[var(--muted)]">({reviews})</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 text-[var(--foreground)]">
          {typeof book.price === 'number' ? (
            <>
              <b className="text-[12px]">{formatCurrency(book.price)}</b>
              {book.originalPrice && book.originalPrice > book.price ? (
                <s className="text-[10px] text-[var(--muted)]">{formatCurrency(book.originalPrice)}</s>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-[var(--muted)]">Price unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}
