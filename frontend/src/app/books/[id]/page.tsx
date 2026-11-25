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
import { booksService } from '@/lib/api';
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
      const storeRes = await booksService.getById(bookId);
      if (storeRes?.success && storeRes.data) {
        const book: ICommercialBook & {
          author?: string;
          authors?: { name: string }[];
          originalPrice?: number;
          reviewCount?: number;
        } = storeRes.data;
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
  const isInCart = useAppSelector((state) =>
    Boolean(
      bookData &&
        state.cart.items.some(
          (item) => String(item.bookId) === String(bookData.id)
        )
    )
  );

  const handleAddToCart = () => {
    if (!bookData || !(bookData.price > 0) || !inStock) return;
    dispatch(
      addToCart({
        bookId: bookData.id,
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.authors,
        price: bookData.price,
        originalPrice: bookData.originalPrice,
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
        originalPrice: bookData.originalPrice,
        isCommercial: bookData.isCommercial,
      })
    );
  };

  if (loading) {
    return (
      <div className="customer-page py-24 text-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="customer-page mx-auto max-w-3xl px-4 py-16">
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
    <div className="customer-page mx-auto box-border w-full max-w-[1014px] px-4 pb-12 pt-3 lg:px-0">
      <p className="mb-6 text-[12px] text-[var(--muted)]">
        Home / <span className="text-[var(--foreground)]">Book({String(bookData.id).slice(-2)})</span>
      </p>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[402px_minmax(0,1fr)] lg:gap-[52px]">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <div className="order-2 mt-3 flex flex-row gap-2 sm:order-none sm:mt-0 sm:w-[42px] sm:shrink-0 sm:flex-col">
            {[0, 1].map((thumbnail) => (
              <div
                key={thumbnail}
                className="box-border flex h-[52px] w-[42px] items-center justify-center border-[1px] border-solid border-[#e2e2e2]"
              >
                <BookCoverImage
                  src={bookData.coverImage}
                  title={bookData.title}
                  author={bookData.authors}
                  className={`h-[46px] w-[34px] rounded-none object-contain p-0 shadow-none ${
                    thumbnail === 1 ? 'opacity-80' : ''
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="w-full min-w-0 sm:w-[360px]">
            <div className="box-border flex h-[360px] w-full items-center justify-center border-[1px] border-solid border-[#e2e2e2] px-10 py-6 sm:h-[412px] sm:w-[360px]">
              <BookCoverImage
                src={bookData.coverImage}
                title={bookData.title}
                author={bookData.authors}
                className="h-[310px] w-[247px] max-h-full max-w-full rounded-none object-contain p-0 shadow-none sm:h-[364px] sm:w-[280px]"
              />
            </div>
            <div className="mt-5 flex gap-5">
              {inStock ? (
                <Button
                  type="primary"
                  disabled={isInCart}
                  className={`h-10 flex-1 rounded-none px-2 text-[12px] ${
                    isInCart ? '!bg-emerald-600' : 'bg-[#a03037]'
                  }`}
                  onClick={handleAddToCart}
                >
                  {isInCart ? 'ADDED' : 'ADD TO BAG'}
                </Button>
              ) : (
                <Button
                  type="primary"
                  className="h-10 flex-1 rounded-none bg-[#a03037] px-2 text-[12px]"
                  onClick={() => message.success('We will notify you when this book is back in stock.')}
                >
                  NOTIFY ME
                </Button>
              )}
              <Button
                className="h-10 flex-1 rounded-none border-0 bg-[#333] px-2 text-[12px] text-white hover:!bg-[#222] hover:!text-white"
                icon={isWishlisted ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleToggleWishlist}
              >
                WISHLIST
              </Button>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="m-0 text-[24px] font-medium leading-[29px]">{bookData.title}</h1>
          <p className="mb-0 mt-1 text-[14px] text-[var(--muted)]">by {bookData.authors}</p>
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            {typeof bookData.rating === 'number' ? (
              <span className="rounded-sm bg-[var(--rating)] px-1.5 py-0.5 text-[12px] font-semibold text-white">
                {bookData.rating.toFixed(1)} ★
              </span>
            ) : null}
            <span className="text-[var(--muted)]">({bookData.reviewCount || 20})</span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-[24px] font-bold">{formatCurrency(bookData.price)}</span>
            {bookData.originalPrice && bookData.originalPrice > bookData.price ? (
              <s className="text-[12px] text-[var(--muted)]">{formatCurrency(bookData.originalPrice)}</s>
            ) : null}
          </div>
          <hr className="my-4 border-[var(--border)]" />
          <p className="m-0 text-[12px] font-medium">* Book Detail</p>
          <p className="mb-0 mt-2 max-w-xl text-[11px] leading-[14px] text-[var(--muted)]">
            {bookData.description ||
              'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.'}
          </p>
          <hr className="my-6 border-[var(--border)]" />
          <h2 className="m-0 text-[16px] font-medium">Customer Feedback</h2>
          <div className="mt-3 border-[1px] border-solid border-[var(--border)] bg-[#fafafa] p-4 dark:bg-[#1a1a1a]">
            <p className="m-0 text-[12px]">Overall rating</p>
            <Rate value={reviewStars} onChange={setReviewStars} className="my-2 text-[16px]" />
            <Input.TextArea
              rows={2}
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
          {[
            {
              initials: 'AC',
              name: 'Aniket Chile',
              rating: 3,
              review:
                'Good product. The translation could be better, but the story is thought-provoking and the writing is concise.',
            },
            {
              initials: 'SB',
              name: 'Shweta Bodkar',
              rating: 4,
              review:
                'An enjoyable read with memorable ideas. The book is well presented and easy to recommend.',
            },
          ].map((review) => (
            <div key={review.initials} className="mt-5 flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eee] text-[9px] font-medium text-[#888]">
                {review.initials}
              </div>
              <div className="min-w-0">
                <p className="mb-0 text-[12px] font-medium">{review.name}</p>
                <Rate disabled defaultValue={review.rating} className="text-[14px] text-amber-400" />
                <p className="mb-0 mt-1 text-[11px] leading-[14px] text-[var(--muted)]">{review.review}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
