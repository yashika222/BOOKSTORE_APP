'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Tag, Spin } from 'antd';
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
import BookCard from '@/components/books/BookCard';
import { SAMPLE_COMMERCIAL_BOOKS } from '@/lib/sampleBooks';
import { GutendexBook, ICommercialBook } from '@/types';
import api from '@/lib/axios';

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [commercialBooks, setCommercialBooks] = useState<ICommercialBook[]>(SAMPLE_COMMERCIAL_BOOKS);
  const [popularGutendex, setPopularGutendex] = useState<GutendexBook[]>([]);
  const [loadingGutendex, setLoadingGutendex] = useState(true);

  // Load commercial books from MongoDB backend (fallback to SAMPLE_COMMERCIAL_BOOKS)
  useEffect(() => {
    api
      .get('/api/books?limit=8')
      .then((res) => {
        if (res.data?.success && res.data?.data && res.data.data.length > 0) {
          setCommercialBooks(res.data.data);
        }
      })
      .catch(() => {
        // Fallback to sample books
      });
  }, []);

  // Fetch initial popular books directly from Gutendex public API
  useEffect(() => {
    fetch('https://gutendex.com/books/?languages=en')
      .then((res) => res.json())
      .then((data) => {
        if (data?.results) {
          // Take top 4 most downloaded classic books
          setPopularGutendex(data.results.slice(0, 4));
        }
      })
      .catch(() => {
        // Network error handling
      })
      .finally(() => {
        setLoadingGutendex(false);
      });
  }, []);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/books?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push('/books');
    }
  };

  const featuredCommercial = commercialBooks.filter((b) => b.featured).slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-100/70 via-purple-50/50 to-transparent pt-12 pb-20 border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold tracking-wide uppercase shadow-sm">
                <RocketOutlined className="text-violet-600" />
                <span>Modern Full-Stack Bookstore & E-Library</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                Find your next great read,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                  anytime, anywhere.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Explore our curated commercial bookstore collection alongside over 10,000+ timeless classics from Project Gutenberg. Integrated with infinite scrolling, live cart, and fast search.
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

            {/* Right Visual Book Card Stack */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-violet-300/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />

                <div className="relative rounded-2xl bg-white p-6 shadow-2xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                      <StarOutlined className="text-amber-500" /> Editor&apos;s Pick
                    </span>
                    <Tag color="purple">Bestseller</Tag>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-36 rounded-lg bg-stone-900 overflow-hidden shadow-md flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80"
                        alt="Atomic Habits"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-gray-900 leading-snug">
                        Atomic Habits
                      </h4>
                      <p className="text-xs text-gray-500">By James Clear</p>
                      <div className="text-violet-600 font-bold text-lg pt-1">$18.50</div>
                      <p className="text-[11px] text-gray-500 line-clamp-2">
                        Tiny changes, remarkable results for your daily productivity.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <SafetyCertificateOutlined /> In Stock (24 units)
                    </span>
                    <Link href="/books?search=Atomic" className="text-violet-600 font-semibold hover:underline">
                      View Book →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
              <h3 className="font-bold text-base text-gray-900 mb-1">Infinite Scrolling Catalog</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Seamless IntersectionObserver integration loads books progressively from Gutendex API with zero duplicates (Set DSA).
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 mb-1">Redux State + Stack Undo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Centralized Redux Toolkit state with local storage persistence and Stack-based Cart Undo for safe item removals.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
              <BookOutlined />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 mb-1">Commercial Inventory & Orders</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                MongoDB persistence for commercial inventory, JWT authentication, and simulated order queue checkout.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCommercial.map((book) => (
            <CommercialBookCard key={book.isbn || book.id} book={book} />
          ))}
        </div>
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

      {/* Popular Public Domain Books (Gutendex API) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-1.5">
              <FireOutlined /> Project Gutenberg E-Library
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Trending Public Domain Classics
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Fetched dynamically from Gutendex API with full ebook metadata.
            </p>
          </div>
          <Link href="/books">
            <Button type="link" className="font-semibold text-violet-600 p-0 flex items-center gap-1">
              <span>Open Catalog</span>
              <ArrowRightOutlined />
            </Button>
          </Link>
        </div>

        {loadingGutendex ? (
          <div className="py-16 text-center">
            <Spin size="large" tip="Loading Gutenberg titles..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularGutendex.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
