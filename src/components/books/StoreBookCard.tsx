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
}: {
  book: StoreBook;
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
    <article className="group relative flex min-h-[340px] flex-col items-center bg-[var(--card)] px-4 pb-4 pt-5 shadow-[0_0_0_1px_var(--border)]">
      <Link href={`/books/${id}`} className="relative block" aria-label={`View details for ${title}`}>
        <BookCoverImage
          src={book.coverImage}
          title={title}
          author={author}
          className={`h-[168px] w-[120px] object-cover shadow-md ${inStock ? '' : 'opacity-50 grayscale'}`}
        />
        {!inStock ? (
          <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#333] shadow">
            OUT OF STOCK
          </span>
        ) : (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-black/70 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white group-hover:block">
            QUICK VIEW
          </span>
        )}
      </Link>
      <Link
        href={`/books/${id}`}
        className="mt-3 w-full truncate text-center text-[15px] font-medium text-[var(--foreground)]"
        title={title}
      >
        {title}
      </Link>
      <p className="w-full truncate text-center text-[12px] text-[var(--muted)]">by {author}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[12px]">
        {typeof book.rating === 'number' ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--rating)] px-1.5 py-0.5 font-semibold text-white">
            {book.rating.toFixed(1)} ★
          </span>
        ) : null}
        <span className="text-[var(--muted)]">({reviews})</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2 text-[var(--foreground)]">
        {typeof book.price === 'number' ? (
          <>
            <b className="text-[15px]">{formatCurrency(book.price)}</b>
            {book.originalPrice && book.originalPrice > book.price ? (
              <s className="text-[12px] text-[var(--muted)]">{formatCurrency(book.originalPrice)}</s>
            ) : null}
          </>
        ) : (
          <span className="text-xs text-[var(--muted)]">Price unavailable</span>
        )}
      </div>
    </article>
  );
}
