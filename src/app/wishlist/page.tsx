'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Empty, Card, Tag, message, Tooltip, Popconfirm } from 'antd';
import {
  HeartFilled,
  DeleteOutlined,
  ShoppingCartOutlined,
  ClearOutlined,
  BookOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeFromWishlist, clearWishlist } from '@/store/wishlistSlice';
import { addToCart } from '@/store/cartSlice';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const handleMoveToCart = (item: (typeof wishlistItems)[0]) => {
    dispatch(
      addToCart({
        bookId: item.bookId,
        title: item.title,
        author: item.author,
        price: item.price || 9.99,
        coverImage: item.coverImage,
        qty: 1,
        stock: 50,
        isCommercial: item.isCommercial,
      })
    );
    message.success(`Added "${item.title}" to cart!`);
  };

  const handleRemove = (bookId: string | number) => {
    dispatch(removeFromWishlist(bookId));
    message.info('Removed from wishlist');
  };

  const handleClearAll = () => {
    dispatch(clearWishlist());
    message.info('Wishlist cleared');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              My Wishlist
            </h1>
            <Tag color="magenta" className="text-xs font-bold">
              {wishlistItems.length} items
            </Tag>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Saved books powered by <code>Set</code> uniqueness logic (zero duplicate entries).
          </p>
        </div>

        {wishlistItems.length > 0 && (
          <Popconfirm
            title="Clear Wishlist"
            description="Remove all books from your wishlist?"
            onConfirm={handleClearAll}
            okText="Yes, Clear"
            cancelText="Cancel"
          >
            <Button icon={<ClearOutlined />} danger>
              Clear All
            </Button>
          </Popconfirm>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-200/80 shadow-sm text-center">
          <Empty
            image={
              <div className="w-16 h-16 rounded-full bg-pink-50 text-red-400 mx-auto flex items-center justify-center text-3xl">
                <HeartFilled />
              </div>
            }
            description={
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-800">
                  Your wishlist is empty
                </h3>
                <p className="text-sm text-gray-500">
                  Explore our catalog and click the heart icon on any book to save it for later.
                </p>
              </div>
            }
          >
            <Link href="/books">
              <Button type="primary" size="large" className="bg-violet-600 mt-2">
                Discover Books
              </Button>
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <Card
              key={String(item.bookId)}
              hoverable
              className="h-full flex flex-col justify-between rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden"
              bodyStyle={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1 }}
              cover={
                <div className="h-48 bg-stone-100 flex items-center justify-center p-3 relative group">
                  {item.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain rounded drop-shadow group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <BookOutlined className="text-4xl text-violet-400 mb-1" />
                      <div className="text-xs font-semibold px-2 line-clamp-1">{item.title}</div>
                    </div>
                  )}

                  <Tooltip title="Remove from wishlist">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.bookId)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-red-500 hover:bg-red-50 flex items-center justify-center shadow-sm transition-all"
                    >
                      <DeleteOutlined />
                    </button>
                  </Tooltip>
                </div>
              }
            >
              <div className="flex-1 flex flex-col">
                <Link href={`/books/${item.bookId}`}>
                  <h3
                    className="font-bold text-sm text-gray-900 hover:text-violet-600 transition-colors line-clamp-2 leading-snug mb-1"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                </Link>

                <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                  By {item.author}
                </p>

                <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-violet-700">
                    ${(item.price || 9.99).toFixed(2)}
                  </span>
                  {item.isCommercial ? (
                    <Tag color="gold" className="text-[10px]">
                      Commercial
                    </Tag>
                  ) : (
                    <Tag color="purple" className="text-[10px]">
                      Gutenberg
                    </Tag>
                  )}
                </div>

                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleMoveToCart(item)}
                  className="mt-3 bg-violet-600 hover:bg-violet-700 text-xs font-semibold"
                  block
                >
                  Move to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* DSA Set Concept note */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 text-xs text-gray-600 flex items-center gap-3">
        <CheckCircleOutlined className="text-emerald-500 text-lg flex-shrink-0" />
        <div>
          <b>DSA Implementation:</b> The wishlist utilizes a <code>Set</code> membership check to enforce uniqueness before adding an item. Duplicate clicks on the same book are rejected in <code>O(1)</code> time complexity.
        </div>
      </div>
    </div>
  );
}
