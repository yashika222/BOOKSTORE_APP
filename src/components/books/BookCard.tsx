'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button, Tag, Tooltip, message } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  DownloadOutlined,
  EyeOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { GutendexBook } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { toggleWishlist } from '@/store/wishlistSlice';

interface BookCardProps {
  book: GutendexBook;
}

export default function BookCard({ book }: BookCardProps) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  // Check if book is already in wishlist using Set check concept
  const isWishlisted = wishlistItems.some((i) => String(i.bookId) === String(book.id));

  const coverUrl = book.formats['image/jpeg'] || book.formats['image/png'];
  const authorNames =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(', ')
      : 'Unknown Author';

  // Demo standard price for public domain book purchase option ($8.99 default)
  const demoPrice = 8.99;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(
      addToCart({
        bookId: book.id,
        title: book.title,
        author: authorNames,
        price: demoPrice,
        coverImage: coverUrl,
        qty: 1,
        stock: 50,
        isCommercial: false,
      })
    );
    message.success(`Added "${book.title.slice(0, 30)}..." to cart!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(
      toggleWishlist({
        bookId: book.id,
        title: book.title,
        author: authorNames,
        coverImage: coverUrl,
        price: demoPrice,
        isCommercial: false,
        subjects: book.subjects?.slice(0, 3),
      })
    );

    if (isWishlisted) {
      message.info(`Removed "${book.title.slice(0, 25)}..." from wishlist`);
    } else {
      message.success(`Added to wishlist! (Set ensures uniqueness)`);
    }
  };

  return (
    <Card
      hoverable
      className="h-full flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200/80 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      bodyStyle={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1 }}
      cover={
        <Link href={`/books/${book.id}`} className="block relative bg-gray-100 overflow-hidden group">
          <div className="h-56 w-full flex items-center justify-center p-3 relative">
            {coverUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                loading="lazy"
                className="max-h-full max-w-full object-contain rounded drop-shadow group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200 p-4 text-center">
                <BookOutlined className="text-4xl mb-2 text-violet-400" />
                <span className="text-xs font-medium text-gray-600 line-clamp-2">
                  {book.title}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">No cover available</span>
              </div>
            )}

            {/* Wishlist Floating Button */}
            <Tooltip title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist (Set)'}>
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
                  isWishlisted
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white'
                }`}
              >
                {isWishlisted ? <HeartFilled /> : <HeartOutlined />}
              </button>
            </Tooltip>

            {/* Gutenberg Catalog Tag */}
            <div className="absolute bottom-2 left-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-900/80 text-white backdrop-blur-sm">
                Ebook #{book.id}
              </span>
            </div>
          </div>
        </Link>
      }
    >
      <div className="flex-1 flex flex-col">
        {/* Subjects / Genre Tags */}
        <div className="mb-1.5 flex flex-wrap gap-1">
          {book.subjects && book.subjects.length > 0 ? (
            <Tag color="purple" className="text-[11px] mr-1 mb-1 truncate max-w-[180px]">
              {book.subjects[0].split('--')[0].trim()}
            </Tag>
          ) : (
            <Tag className="text-[11px] mr-1 mb-1">Classic</Tag>
          )}
        </div>

        {/* Title */}
        <Link href={`/books/${book.id}`}>
          <h3
            className="font-bold text-sm text-gray-900 hover:text-violet-600 transition-colors line-clamp-2 leading-snug mb-1"
            title={book.title}
          >
            {book.title}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-xs text-gray-500 line-clamp-1 mb-2" title={authorNames}>
          By {authorNames}
        </p>

        {/* Metadata info */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 text-[11px]">
            <DownloadOutlined className="text-violet-500" />
            <span>{book.download_count?.toLocaleString() || 0}</span>
          </span>
          <span className="font-bold text-sm text-gray-900">${demoPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
        <Link href={`/books/${book.id}`} className="block">
          <Button
            size="small"
            block
            icon={<EyeOutlined />}
            className="text-xs flex items-center justify-center font-medium"
          >
            Details
          </Button>
        </Link>
        <Button
          type="primary"
          size="small"
          icon={<ShoppingCartOutlined />}
          onClick={handleAddToCart}
          className="text-xs flex items-center justify-center font-medium bg-violet-600 hover:bg-violet-700"
        >
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}
