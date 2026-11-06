'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button, Tag, Rate, Tooltip, App } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ICommercialBook } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { toggleWishlist } from '@/store/wishlistSlice';
import { useAuthPrompt } from '@/hooks/useAuthPrompt';
import BookCoverImage from './BookCoverImage';
import { bookDetailsHref } from '@/lib/bookRoutes';

interface CommercialBookCardProps {
  book: ICommercialBook;
}

export default function CommercialBookCard({ book }: CommercialBookCardProps) {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const { requireAuthentication } = useAuthPrompt();

  const bookKey = book._id || book.id || book.isbn;
  const detailsHref = bookDetailsHref(bookKey as string, 'store');
  const isWishlisted = wishlistItems.some((i) => String(i.bookId) === String(bookKey));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuthentication('Please log in to add books to your cart.')) return;

    if (book.stock <= 0) {
      message.warning('This book is currently out of stock.');
      return;
    }

    dispatch(
      addToCart({
        bookId: bookKey,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        price: book.price,
        coverImage: book.coverImage,
        qty: 1,
        stock: book.stock,
        isCommercial: true,
        source: 'store',
      })
    );
    message.success(`Added "${book.title}" to your cart.`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuthentication('Please log in to add books to your wishlist.')) return;

    dispatch(
      toggleWishlist({
        bookId: bookKey,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage,
        price: book.price,
        isCommercial: true,
        source: 'store',
        subjects: [book.genre],
      })
    );

    message.success(isWishlisted ? `Removed "${book.title}" from your wishlist.` : `Saved "${book.title}" to your wishlist.`);
  };

  return (
    <Card
      hoverable
      className="flex h-full flex-col justify-between overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      styles={{ body: { padding: 14, display: 'flex', flexDirection: 'column', flex: 1 } }}
      cover={
        <div className="relative isolate overflow-hidden bg-stone-50">
          <Link href={detailsHref} className="group block">
            <div className="relative flex h-56 w-full items-center justify-center p-3">
              <BookCoverImage
                src={book.coverImage}
                title={book.title}
                author={book.author}
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
        <div className="mb-1 flex items-center justify-between gap-2">
          <Tag color="cyan" className="mr-0 text-[11px] font-medium">
            {book.genre}
          </Tag>
          {typeof book.rating === 'number' && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Rate disabled allowHalf value={book.rating} className="text-xs text-amber-400" />
            </div>
          )}
        </div>

        <Link href={detailsHref}>
          <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900" title={book.title}>
            {book.title}
          </h3>
        </Link>
        <p className="mb-2 line-clamp-1 text-xs text-gray-500">By {book.author}</p>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
          <div>
            <div className="text-base font-extrabold text-violet-700">${book.price.toFixed(2)}</div>
            <div className="text-[10px] text-gray-500">
              {book.stock > 0 ? (
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <CheckCircleOutlined /> In stock ({book.stock})
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-red-500">
                  <ExclamationCircleOutlined /> Out of stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={detailsHref}>
          <Button size="small" block icon={<EyeOutlined />} className="text-xs">
            Details
          </Button>
        </Link>
        <Button
          type="primary"
          size="small"
          icon={<ShoppingCartOutlined />}
          onClick={handleAddToCart}
          disabled={book.stock <= 0}
          className="bg-violet-600 text-xs font-medium"
        >
          Add to cart
        </Button>
      </div>
    </Card>
  );
}
