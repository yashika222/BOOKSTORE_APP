'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button, Tag, Tooltip, App } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  DownloadOutlined,
  EyeOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { GutendexBook } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleWishlist } from '@/store/wishlistSlice';
import { useAuthPrompt } from '@/hooks/useAuthPrompt';
import BookCoverImage from './BookCoverImage';
import { bookDetailsHref } from '@/lib/bookRoutes';
import { getEbookDownloadUrl, getEbookReadUrl } from '@/lib/ebookFormats';

interface BookCardProps {
  book: GutendexBook;
}

export default function BookCard({ book }: BookCardProps) {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const { requireAuthentication } = useAuthPrompt();

  const isWishlisted = wishlistItems.some((i) => String(i.bookId) === String(book.id));
  const coverUrl = book.formats['image/jpeg'] || book.formats['image/png'];
  const authorNames =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(', ')
      : 'Unknown Author';
  const detailsHref = bookDetailsHref(book.id, 'gutendex');
  const readUrl = getEbookReadUrl(book.formats);
  const download = getEbookDownloadUrl(book.formats);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuthentication('Please log in to add books to your wishlist.')) return;

    dispatch(
      toggleWishlist({
        bookId: book.id,
        title: book.title,
        author: authorNames,
        coverImage: coverUrl,
        isCommercial: false,
        source: 'gutendex',
        subjects: book.subjects?.slice(0, 3),
      })
    );

    message.success(isWishlisted ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
  };

  return (
    <Card
      hoverable
      className="flex h-full flex-col justify-between overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      styles={{ body: { padding: 14, display: 'flex', flexDirection: 'column', flex: 1 } }}
      cover={
        <div className="relative isolate overflow-hidden bg-gray-100">
          <Link href={detailsHref} className="group block">
            <div className="flex h-56 w-full items-center justify-center p-3">
              <BookCoverImage
                src={coverUrl}
                title={book.title}
                author={authorNames}
                className="max-h-full max-w-full rounded object-contain drop-shadow transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>
          <Tooltip title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}>
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
              className={`absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 shadow-md transition-colors ${
                isWishlisted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-red-500'
              }`}
            >
              {isWishlisted ? <HeartFilled /> : <HeartOutlined />}
            </button>
          </Tooltip>
        </div>
      }
    >
      <div className="flex flex-1 flex-col">
        <div className="mb-1.5 flex flex-wrap gap-1">
          {book.subjects?.[0] ? (
            <Tag color="purple" className="mb-1 mr-1 max-w-[180px] truncate text-[11px]">
              {book.subjects[0].split('--')[0].trim()}
            </Tag>
          ) : (
            <Tag className="mb-1 mr-1 text-[11px]">Classic</Tag>
          )}
        </div>

        <Link href={detailsHref}>
          <h3
            className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors hover:text-violet-600"
            title={book.title}
          >
            {book.title}
          </h3>
        </Link>

        <p className="mb-2 line-clamp-1 text-xs text-gray-500" title={authorNames}>
          By {authorNames}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1 text-[11px]">
            <DownloadOutlined className="text-violet-500" />
            <span>{book.download_count?.toLocaleString() || 0}</span>
          </span>
          <span className="text-sm font-semibold text-emerald-700">Free ebook</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <Link href={detailsHref} className="block">
          <Button size="small" block icon={<EyeOutlined />} className="text-xs font-medium">
            Details
          </Button>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          {readUrl ? (
            <a href={readUrl} target="_blank" rel="noreferrer">
              <Button size="small" block icon={<ReadOutlined />} className="text-xs">
                Read
              </Button>
            </a>
          ) : (
            <Button size="small" block disabled className="text-xs">
              Read
            </Button>
          )}
          {download ? (
            <a
              href={`/api/ebooks/download?url=${encodeURIComponent(download.url)}&title=${encodeURIComponent(book.title)}`}
            >
              <Button size="small" block icon={<DownloadOutlined />} className="text-xs">
                Download
              </Button>
            </a>
          ) : (
            <Button size="small" block disabled className="text-xs">
              Download
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
