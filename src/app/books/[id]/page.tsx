'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spin, Alert, Rate, Input, message } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { ICommercialBook } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { toggleWishlist } from '@/store/wishlistSlice';
import api from '@/lib/axios';
import { useAuthPrompt } from '@/hooks/useAuthPrompt';
import BookCoverImage from '@/components/books/BookCoverImage';
import { formatCurrency } from '@/lib/currency';
import { useQuery } from '@tanstack/react-query';

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { requireAuthentication } = useAuthPrompt();
  const bookId = String(params?.id || '');
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState(0);

  type BookView = {
    id: string | number;
    title: string;
    authors: string;
    description?: string;
    coverImage?: string;
    price: number;
    originalPrice?: number;
    stock: number;
    isCommercial: boolean;
    rating?: number;
    reviewCount?: number;
    isbn?: string;
  };

  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.some((i) => String(i.bookId) === bookId);

  const bookQuery = useQuery({
    queryKey: ['book', bookId],
    enabled: Boolean(bookId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BookView> => {
      const storeRes = await api.get(`/api/books/${bookId}`);
      if (storeRes?.data?.success && storeRes.data.data) {
        const book: ICommercialBook & {
          author?: string;
          authors?: { name: string }[];
          originalPrice?: number;
          reviewCount?: number;
        } = storeRes.data.data;
        const authorName =
          book.author ||
          (Array.isArray(book.authors) ? book.authors.map((item) => item.name).join(', ') : 'Unknown Author');
        return {
          id: book._id || book.id || bookId,
          title: book.title,
          authors: authorName,
          description: book.description,
          coverImage: book.coverImage,
          price: book.price || 0,
          originalPrice: book.originalPrice,
          stock: book.stock,
          isCommercial: typeof book.price === 'number',
          rating: book.rating,
          reviewCount: book.reviewCount,
          isbn: book.isbn,
        };
      }
      throw new Error('Book not found');
    },
  });

  const bookData = bookQuery.data || null;
  const loading = bookQuery.isLoading;
  const error = bookQuery.error instanceof Error ? bookQuery.error.message : bookQuery.error ? 'Failed to load book details.' : null;
  const inStock = Boolean(bookData && bookData.stock > 0);

  const handleAddToCart = () => {
    if (!bookData || !(bookData.price > 0) || !inStock) return;
    dispatch(
      addToCart({
        bookId: bookData.id,
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.authors,
        price: bookData.price,
        coverImage: bookData.coverImage,
        qty: 1,
        stock: bookData.stock,
        isCommercial: bookData.price > 0,
      })
    );
    message.success(`Added "${bookData.title}" to cart`);
  };

  const handleToggleWishlist = () => {
    if (!bookData) return;
    if (!requireAuthentication('Please log in to save a wishlist.')) return;
    dispatch(
      toggleWishlist({
        bookId: bookData.id,
        title: bookData.title,
        author: bookData.authors,
        coverImage: bookData.coverImage,
        price: bookData.price,
        isCommercial: bookData.isCommercial,
      })
    );
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Alert
          type="error"
          message="Book Not Found"
          description={error}
          showIcon
          action={<Button onClick={() => router.push('/books')}>Return to Catalog</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-10">
      <p className="mb-6 text-sm text-[var(--muted)]">
        Home / <span className="text-[var(--foreground)]">Book({String(bookData.id).slice(-2)})</span>
      </p>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-2">
              <BookCoverImage src={bookData.coverImage} title={bookData.title} author={bookData.authors} className="h-16 w-12 object-cover" />
              <BookCoverImage src={bookData.coverImage} title={bookData.title} author={bookData.authors} className="h-16 w-12 object-cover opacity-80" />
            </div>
            <BookCoverImage
              src={bookData.coverImage}
              title={bookData.title}
              author={bookData.authors}
              className="h-[280px] w-[200px] object-cover shadow"
            />
          </div>
          <div className="mt-6 flex gap-3">
            {inStock ? (
              <Button type="primary" className="h-11 min-w-[140px] bg-[#a03037]" onClick={handleAddToCart}>
                ADD TO BAG
              </Button>
            ) : (
              <Button
                type="primary"
                className="h-11 min-w-[140px] bg-[#a03037]"
                onClick={() => message.success('We will notify you when this book is back in stock.')}
              >
                NOTIFY ME
              </Button>
            )}
            <Button
              className="h-11 min-w-[140px] bg-[#333] text-white"
              icon={isWishlisted ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleToggleWishlist}
            >
              WISHLIST
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{bookData.title}</h1>
          <p className="mt-1 text-[var(--muted)]">by {bookData.authors}</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {typeof bookData.rating === 'number' ? (
              <span className="rounded-sm bg-[var(--rating)] px-1.5 py-0.5 text-xs font-semibold text-white">
                {bookData.rating.toFixed(1)} ★
              </span>
            ) : null}
            <span className="text-[var(--muted)]">({bookData.reviewCount || 20})</span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{formatCurrency(bookData.price)}</span>
            {bookData.originalPrice && bookData.originalPrice > bookData.price ? (
              <s className="text-[var(--muted)]">{formatCurrency(bookData.originalPrice)}</s>
            ) : null}
          </div>
          <hr className="my-5 border-[var(--border)]" />
          <p className="text-sm font-medium">* Book Detail</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            {bookData.description ||
              'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.'}
          </p>
          <hr className="my-6 border-[var(--border)]" />
          <h2 className="text-lg font-semibold">Customer Feedback</h2>
          <div className="mt-3 border border-[var(--border)] bg-[#fafafa] p-4 dark:bg-[#1a1a1a]">
            <p className="text-sm">Overall rating</p>
            <Rate value={reviewStars} onChange={setReviewStars} className="my-2" />
            <Input.TextArea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review"
            />
            <div className="mt-3 text-right">
              <Button
                type="primary"
                className="bg-[var(--action)]"
                onClick={() => {
                  if (!requireAuthentication('Please log in to submit a review.')) return;
                  message.success('Review submitted.');
                  setReviewText('');
                }}
              >
                Submit
              </Button>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ddd] text-xs font-bold">AC</div>
            <div>
              <p className="text-sm font-medium">Aniket Chile</p>
              <Rate disabled defaultValue={3} className="text-sm text-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
