'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Input, Tag, Spin } from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  FireOutlined,
  StarOutlined,
  ArrowRightOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import CommercialBookCard from '@/components/books/CommercialBookCard';
import BookCoverImage from '@/components/books/BookCoverImage';
import { ICommercialBook } from '@/types';
import { SAMPLE_COMMERCIAL_BOOKS } from '@/lib/sampleBooks';
import { booksService } from '@/lib/api';

export default function StorefrontPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [commercialBooks, setCommercialBooks] = useState<ICommercialBook[]>(SAMPLE_COMMERCIAL_BOOKS);
  const [commercialError, setCommercialError] = useState<string | null>(null);
  const [popularBooks, setPopularBooks] = useState<ICommercialBook[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);

  useEffect(() => {
    booksService
      .list({ page: 1, pageSize: 8, sort: 'popular' })
      .then((res) => {
        if (res?.success && Array.isArray(res?.data) && res.data.length > 0) {
          setCommercialBooks(res.data);
          setCommercialError(res.fallback ? res.warning || null : null);
        } else {
          setCommercialBooks(SAMPLE_COMMERCIAL_BOOKS);
        }
      })
      .catch((error: unknown) => {
        setCommercialBooks(SAMPLE_COMMERCIAL_BOOKS);
        setCommercialError(error instanceof Error ? error.message : null);
      });
  }, []);

  useEffect(() => {
    booksService
      .list({ page: 2, pageSize: 8, sort: 'popular' })
      .then((res) => {
        if (res?.success && Array.isArray(res?.data)) {
          setPopularBooks(res.data);
          setPopularError(res.fallback ? res.warning || null : null);
        }
      })
      .catch((error: unknown) => {
        setPopularError(error instanceof Error ? error.message : 'Unable to load more store books.');
      })
      .finally(() => {
        setLoadingPopular(false);
      });
  }, []);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/books?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push('/books');
    }
  };

  const featuredCommercial = commercialBooks.filter((book) => book.featured).slice(0, 4);
  const editorPick = featuredCommercial[0];

  return (
    <div className="customer-page space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-100/70 via-purple-50/50 to-transparent pt-12 pb-16 border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 ${editorPick ? 'lg:grid-cols-12' : ''} gap-12 items-center`}>
            {/* Left Content */}
            <div className={`${editorPick ? 'lg:col-span-7' : ''} space-y-6 text-center lg:text-left`}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold tracking-wide uppercase shadow-sm">
                <RocketOutlined className="text-violet-600" />
                <span>Books for curious minds</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                Find your next great read,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                  anytime, anywhere.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Browse a thoughtfully selected collection of contemporary reads alongside thousands of timeless classics.
              </p>

              {/* Hero Search Box */}
              <div className="max-w-xl mx-auto lg:mx-0 bg-white p-2 rounded-2xl shadow-lg border border-gray-200/80 flex items-center gap-2">
                <Input
                  size="large"
                  variant="borderless"
                  placeholder="Search by title, author, or genre (e.g. Orwell, Dune)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onPressEnter={() => handleSearch(searchTerm)}
                  prefix={<SearchOutlined className="text-gray-400 mr-2 text-lg" />}
                  className="text-sm sm:text-base"
                />
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleSearch(searchTerm)}
                  className="bg-violet-600 hover:bg-violet-700 px-6 font-semibold shadow-md flex items-center gap-1.5"
                >
                  <span>Search</span>
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/books">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CompassOutlined />}
                    className="bg-gray-900 hover:bg-gray-800 font-semibold"
                  >
                    Browse Infinite Catalog
                  </Button>
                </Link>
                <Link href="/books?tab=commercial">
                  <Button size="large" className="font-semibold border-gray-300">
                    Commercial Books & Pricing
                  </Button>
                </Link>
              </div>
            </div>

            {editorPick && (
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-violet-300/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />

                <div className="relative rounded-2xl bg-white p-6 shadow-2xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                      <StarOutlined className="text-amber-500" /> Featured in our store
                    </span>
                    <Tag color="purple">{editorPick.genre}</Tag>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-36 rounded-lg bg-stone-900 overflow-hidden shadow-md flex-shrink-0">
                      <BookCoverImage
                        src={editorPick.coverImage}
                        title={editorPick.title}
                        author={editorPick.author}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-gray-900 leading-snug">
                        {editorPick.title}
                      </h4>
                      <p className="text-xs text-gray-500">By {editorPick.author}</p>
                      <div className="text-violet-600 font-bold text-lg pt-1">
                        ${editorPick.price.toFixed(2)}
                      </div>
                      {editorPick.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-2">
                          {editorPick.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className={`flex items-center gap-1 font-medium ${editorPick.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      <SafetyCertificateOutlined />
                      {editorPick.stock > 0 ? `In Stock (${editorPick.stock} units)` : 'Out of stock'}
                    </span>
                    <Link
                      href={`/books/${editorPick._id || editorPick.id || editorPick.isbn}`}
                      className="text-violet-600 font-semibold hover:underline"
                    >
                      View Book
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Value Props Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl flex-shrink-0">
              <SyncOutlined />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 mb-1">A world of books</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Explore an ever-growing collection of classic literature and new favourites.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 mb-1">Shopping made simple</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Keep your selected titles together and easily update your order before checkout.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
              <BookOutlined />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 mb-1">Clear, reliable checkout</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                See current availability and pricing for every book in our store collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Commercial Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-1">
              Storefront Picks
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Featured Commercial Books
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Locally managed inventory with pricing, ratings, and stock.
            </p>
          </div>
          <Link href="/books?tab=commercial">
            <Button type="link" className="font-semibold text-violet-600 p-0 flex items-center gap-1">
              <span>View All Commercial</span>
              <ArrowRightOutlined />
            </Button>
          </Link>
        </div>

        {commercialError ? (
          <Alert type="error" showIcon message="Commercial inventory unavailable" description={commercialError} />
        ) : featuredCommercial.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCommercial.map((book) => (
              <CommercialBookCard key={book.isbn || book.id} book={book} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No featured commercial books are currently available.
          </p>
        )}
      </section>

      {/* Category Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Explore By Subject
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Find exactly what you love to read
            </h2>
            <p className="text-sm sm:text-base text-stone-300">
              Select any genre to instantly filter through thousands of classic literature and commercial editions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-8 relative z-10">
            {[
              { name: 'Fiction', icon: '📖', key: 'fiction' },
              { name: 'Classics', icon: '🏛️', key: 'classics' },
              { name: 'Sci-Fi', icon: '🚀', key: 'sci-fi' },
              { name: 'Mystery', icon: '🔍', key: 'mystery' },
              { name: 'Science', icon: '🔬', key: 'science' },
              { name: 'Self-Help', icon: '🧠', key: 'self-help' },
            ].map((cat) => (
              <Link
                key={cat.key}
                href={`/books?genre=${cat.key}`}
                className="bg-stone-800/80 hover:bg-violet-600 border border-stone-700 hover:border-violet-500 rounded-2xl p-4 text-center transition-all duration-200 group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <div className="font-semibold text-sm text-stone-200 group-hover:text-white">
                  {cat.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-1.5">
              <FireOutlined /> From the store catalog
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              More titles in the database
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              The full catalog lives in MongoDB and opens 20 books per page.
            </p>
          </div>
          <Link href="/books?page=2">
            <Button type="link" className="font-semibold text-violet-600 p-0 flex items-center gap-1">
              <span>Open Catalog</span>
              <ArrowRightOutlined />
            </Button>
          </Link>
        </div>

        {loadingPopular ? (
          <div className="py-16 text-center">
            <Spin size="large" />
          </div>
        ) : popularError && popularBooks.length === 0 ? (
          <Alert type="warning" showIcon message="More titles are temporarily unavailable" description={popularError} />
        ) : popularBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularBooks.map((book) => (
              <CommercialBookCard key={book.isbn || book.id} book={book} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No additional store titles are currently available.
          </p>
        )}
      </section>
    </div>
  );
}
