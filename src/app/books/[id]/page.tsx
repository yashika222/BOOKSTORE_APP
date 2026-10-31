'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Tag,
  Spin,
  Alert,
  Breadcrumb,
  Divider,
  InputNumber,
  message,
  Rate,
} from 'antd';
import {
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  DownloadOutlined,
  GlobalOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { GutendexBook, ICommercialBook } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { toggleWishlist } from '@/store/wishlistSlice';
import { SAMPLE_COMMERCIAL_BOOKS } from '@/lib/sampleBooks';
import api from '@/lib/axios';

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const bookId = String(params?.id || '');

  const [bookData, setBookData] = useState<{
    id: string | number;
    title: string;
    authors: string;
    description?: string;
    coverImage?: string;
    subjects: string[];
    languages: string[];
    price: number;
    stock: number;
    downloadCount?: number;
    formats?: Record<string, string>;
    isCommercial: boolean;
    rating?: number;
    isbn?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.some((i) => String(i.bookId) === bookId);

  useEffect(() => {
    if (!bookId) return;

    setLoading(true);
    setError(null);

    // If ID is numeric, fetch from Gutendex API
    const isNumeric = /^\d+$/.test(bookId);

    if (isNumeric) {
      fetch(`https://gutendex.com/books/${bookId}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Book not found on Gutenberg library (HTTP ${res.status}).`);
          }
          const book: GutendexBook = await res.json();
          setBookData({
            id: book.id,
            title: book.title,
            authors:
              book.authors?.map((a) => a.name).join(', ') || 'Unknown Author',
            description: `Classic Project Gutenberg public domain publication. Free digital access provided.`,
            coverImage: book.formats['image/jpeg'] || book.formats['image/png'],
            subjects: book.subjects || [],
            languages: book.languages || ['en'],
            price: 8.99,
            stock: 100,
            downloadCount: book.download_count,
            formats: book.formats,
            isCommercial: false,
          });
        })
        .catch((err) => {
          setError(err.message || 'Failed to load book details.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Commercial book lookup
      api
        .get(`/api/books/${bookId}`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            const book: ICommercialBook = res.data.data;
            setBookData({
              id: book._id || book.id || bookId,
              title: book.title,
              authors: book.author,
              description: book.description,
              coverImage: book.coverImage,
              subjects: [book.genre],
              languages: ['en'],
              price: book.price,
              stock: book.stock,
              isCommercial: true,
              rating: book.rating,
              isbn: book.isbn,
            });
          } else {
            throw new Error('Not found in backend');
          }
        })
        .catch(() => {
          // Check local sample books fallback
          const localMatch = SAMPLE_COMMERCIAL_BOOKS.find(
            (b) => b.id === bookId || b.isbn === bookId
          );
          if (localMatch) {
            setBookData({
              id: localMatch.id || bookId,
              title: localMatch.title,
              authors: localMatch.author,
              description: localMatch.description,
              coverImage: localMatch.coverImage,
              subjects: [localMatch.genre],
              languages: ['en'],
              price: localMatch.price,
              stock: localMatch.stock,
              isCommercial: true,
              rating: localMatch.rating,
              isbn: localMatch.isbn,
            });
          } else {
            setError('Book could not be found in our database.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bookId]);

  const handleAddToCart = () => {
    if (!bookData) return;

    dispatch(
      addToCart({
        bookId: bookData.id,
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.authors,
        price: bookData.price,
        coverImage: bookData.coverImage,
        qty: quantity,
        stock: bookData.stock,
        isCommercial: bookData.isCommercial,
      })
    );
    message.success(`Added ${quantity} × "${bookData.title}" to cart!`);
  };

  const handleToggleWishlist = () => {
    if (!bookData) return;

    dispatch(
      toggleWishlist({
        bookId: bookData.id,
        title: bookData.title,
        author: bookData.authors,
        coverImage: bookData.coverImage,
        price: bookData.price,
        isCommercial: bookData.isCommercial,
        subjects: bookData.subjects.slice(0, 3),
      })
    );

    if (isWishlisted) {
      message.info(`Removed from wishlist`);
    } else {
      message.success(`Saved to wishlist!`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Spin size="large" tip="Loading book details..." />
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Alert
          type="error"
          message="Book Not Found"
          description={error || 'Unable to locate the specified book record.'}
          showIcon
          action={
            <Button onClick={() => router.push('/books')} type="primary">
              Return to Catalog
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { title: <Link href="/">Home</Link> },
            { title: <Link href="/books">Catalog</Link> },
            { title: <span className="text-gray-700 font-medium truncate max-w-[200px]">{bookData.title}</span> },
          ]}
        />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="text-xs font-semibold"
        >
          Back
        </Button>
      </div>

      {/* Main Details Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Book Cover */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200 p-6 flex items-center justify-center shadow-lg border border-gray-200">
            {bookData.coverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={bookData.coverImage}
                alt={bookData.title}
                className="max-h-[420px] w-auto object-contain rounded-lg shadow-xl"
              />
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400">
                <BookOutlined className="text-6xl text-violet-400 mb-4" />
                <span className="font-bold text-gray-700 text-center px-4">
                  {bookData.title}
                </span>
                <span className="text-xs text-gray-400 mt-2">No cover image available</span>
              </div>
            )}

            <div className="absolute top-4 left-4">
              {bookData.isCommercial ? (
                <Tag color="gold" className="font-bold">
                  Commercial Edition
                </Tag>
              ) : (
                <Tag color="purple" className="font-bold">
                  Project Gutenberg #{bookData.id}
                </Tag>
              )}
            </div>
          </div>

          {/* Gutenberg Ebook Reader Formats */}
          {bookData.formats && (
            <div className="w-full max-w-sm mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <ReadOutlined className="text-violet-600" /> Free Ebook Formats:
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {bookData.formats['text/html'] && (
                  <a
                    href={bookData.formats['text/html']}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-violet-700 hover:bg-violet-50 font-medium"
                  >
                    Read Online (HTML)
                  </a>
                )}
                {bookData.formats['application/epub+zip'] && (
                  <a
                    href={bookData.formats['application/epub+zip']}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-violet-700 hover:bg-violet-50 font-medium"
                  >
                    EPUB Ebook
                  </a>
                )}
                {bookData.formats['text/plain; charset=us-ascii'] && (
                  <a
                    href={bookData.formats['text/plain; charset=us-ascii']}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-violet-700 hover:bg-violet-50 font-medium"
                  >
                    Plain Text
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Title, Author, Pricing, Cart & Wishlist */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Subjects Tags */}
            <div className="flex flex-wrap gap-1.5">
              {bookData.subjects.slice(0, 5).map((subject, idx) => (
                <Tag key={idx} color="geekblue" className="text-xs">
                  {subject.split('--')[0].trim()}
                </Tag>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              {bookData.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                By <b className="text-gray-900">{bookData.authors}</b>
              </span>
              {bookData.rating && (
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Rate disabled allowHalf defaultValue={bookData.rating} className="text-sm text-amber-400" />
                  <span>({bookData.rating})</span>
                </div>
              )}
              {bookData.downloadCount !== undefined && (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  <DownloadOutlined /> {bookData.downloadCount.toLocaleString()} downloads
                </span>
              )}
            </div>

            {bookData.isbn && (
              <div className="text-xs text-gray-500 font-mono">
                ISBN: <span className="font-semibold text-gray-800">{bookData.isbn}</span> (Indexed O(1))
              </div>
            )}

            <Divider className="my-4" />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                Synopsis / About This Book
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {bookData.description ||
                  'No description provided for this catalog volume. Complete ebook text is available via Project Gutenberg formats.'}
              </p>
            </div>

            {/* Metadata specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block mb-0.5">Languages</span>
                <span className="font-semibold text-gray-800 uppercase flex items-center gap-1">
                  <GlobalOutlined /> {bookData.languages.join(', ')}
                </span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block mb-0.5">Availability</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircleOutlined /> In Stock ({bookData.stock})
                </span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block mb-0.5">Format</span>
                <span className="font-semibold text-gray-800">
                  {bookData.isCommercial ? 'Hardcover / Paperback' : 'Digital Ebook'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Add to Cart Purchase Section */}
          <div className="bg-gradient-to-r from-purple-50/60 to-indigo-50/60 p-6 rounded-2xl border border-purple-200/80 space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 block">Retail Price</span>
                <span className="text-3xl font-extrabold text-violet-700">
                  ${bookData.price.toFixed(2)}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Quantity:</span>
                <InputNumber
                  min={1}
                  max={bookData.stock}
                  value={quantity}
                  onChange={(val) => setQuantity(val || 1)}
                  className="w-20"
                />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined className="text-lg" />}
                onClick={handleAddToCart}
                className="bg-violet-600 hover:bg-violet-700 font-bold h-12 shadow-md"
              >
                Add to Cart
              </Button>

              <Button
                size="large"
                icon={isWishlisted ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
                onClick={handleToggleWishlist}
                className="font-bold h-12 border-gray-300"
              >
                {isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
