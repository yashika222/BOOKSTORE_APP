'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button, Tag, Rate, Tooltip, message } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';
import { ICommercialBook } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { toggleWishlist } from '@/store/wishlistSlice';

interface CommercialBookCardProps {
  book: ICommercialBook;
}

export default function CommercialBookCard({ book }: CommercialBookCardProps) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const bookKey = book._id || book.id || book.isbn;
  const isWishlisted = wishlistItems.some((i) => String(i.bookId) === String(bookKey));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (book.stock <= 0) {
      message.warning('Sorry, this book is currently out of stock.');
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
      })
    );
    message.success(`Added "${book.title}" to cart!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(
      toggleWishlist({
        bookId: bookKey,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage,
        price: book.price,
        isCommercial: true,
        subjects: [book.genre],
      })
    );

    if (isWishlisted) {
      message.info(`Removed "${book.title}" from wishlist`);
    } else {
      message.success(`Saved to wishlist!`);
    }
  };

  return (
    <Card
      hoverable
      className="h-full flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200/80 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      bodyStyle={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1 }}
      cover={
        <div className="relative bg-gradient-to-b from-stone-50 to-stone-100 overflow-hidden group">
          <div className="h-56 w-full flex items-center justify-center p-3 relative">
            {book.coverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={book.coverImage}
                alt={book.title}
                loading="lazy"
                className="max-h-full max-w-full object-contain rounded drop-shadow group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-violet-50 text-violet-700 p-4 rounded text-center">
                <BarcodeOutlined className="text-3xl mb-2" />
                <span className="font-bold text-sm line-clamp-2">{book.title}</span>
                <span className="text-[10px] text-gray-500 mt-1">ISBN: {book.isbn}</span>
              </div>
            )}

            {/* Wishlist Button */}
            <Tooltip title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}>
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

            {/* Badges */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                Commercial
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-900/80 text-white backdrop-blur-sm">
                O(1) Hash
              </span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <Tag color="cyan" className="text-[11px] font-medium mr-0">
            {book.genre}
          </Tag>
          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
            <Rate disabled allowHalf defaultValue={book.rating || 4.5} className="text-xs text-amber-400" />
            <span className="text-[11px] text-gray-600">({book.rating || 4.5})</span>
          </div>
        </div>

        <h3 className="font-bold text-sm text-gray-900 line-clamp-1 leading-snug mb-1" title={book.title}>
          {book.title}
        </h3>

        <p className="text-xs text-gray-500 line-clamp-1 mb-2">By {book.author}</p>

        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-base font-extrabold text-violet-700">
              ${book.price.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-500">
              {book.stock > 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <CheckCircleOutlined /> In Stock ({book.stock})
                </span>
              ) : (
                <span className="text-red-500 flex items-center gap-0.5">
                  <ExclamationCircleOutlined /> Out of stock
                </span>
              )}
            </div>
          </div>

          <Button
            type="primary"
            size="middle"
            icon={<ShoppingCartOutlined />}
            onClick={handleAddToCart}
            disabled={book.stock <= 0}
            className="bg-violet-600 hover:bg-violet-700 font-medium text-xs flex items-center"
          >
            Buy
          </Button>
        </div>
      </div>
    </Card>
  );
}
