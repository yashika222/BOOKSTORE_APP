'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Input,
  Select,
  Button,
  Spin,
  Empty,
  Alert,
  Tabs,
  Badge,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  BookOutlined,
  ShopOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import BookCard from '@/components/books/BookCard';
import CommercialBookCard from '@/components/books/CommercialBookCard';
import CategoryTree from '@/components/books/CategoryTree';
import { GutendexBook, GutendexApiResponse, ICommercialBook } from '@/types';
import { SAMPLE_COMMERCIAL_BOOKS } from '@/lib/sampleBooks';
import api from '@/lib/axios';

const FIRST_GUTENDEX_PAGE = 'https://gutendex.com/books/?languages=en';

function BooksCatalogContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialGenre = searchParams.get('genre') || 'all';
  const initialTab = searchParams.get('tab') === 'commercial' ? 'commercial' : 'gutendex';

  const [activeTab, setActiveTab] = useState<'gutendex' | 'commercial'>(initialTab);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [sortBy, setSortBy] = useState<'popular' | 'title' | 'id'>('popular');

  // Gutendex Infinite Scroll State
  const [gutendexBooks, setGutendexBooks] = useState<GutendexBook[]>([]);
  const [totalApiCount, setTotalApiCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Commercial Books State
  const [commercialBooks, setCommercialBooks] = useState<ICommercialBook[]>(SAMPLE_COMMERCIAL_BOOKS);
  const [loadingCommercial, setLoadingCommercial] = useState(false);

  // Refs for Infinite Scroll
  const nextUrlRef = useRef<string | null>(FIRST_GUTENDEX_PAGE);
  const loadingRef = useRef<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Build the initial API query URL based on search & genre
  const buildInitialUrl = useCallback((query: string, genre: string): string => {
    let url = 'https://gutendex.com/books/?languages=en';
    if (query.trim()) {
      url += `&search=${encodeURIComponent(query.trim())}`;
    }
    if (genre && genre !== 'all') {
      url += `&topic=${encodeURIComponent(genre)}`;
    }
    return url;
  }, []);

  // Fetch Next Page from Gutendex API
  const loadMoreGutendex = useCallback(async () => {
    const url = nextUrlRef.current;
    if (!url || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Unable to load books from Gutendex (${response.status}).`);
      }

      const data: GutendexApiResponse = await response.json();

      setTotalApiCount(data.count);

      // Deduplicate book items using Set (DSA requirement)
      setGutendexBooks((previous) => {
        const existingIds = new Set(previous.map((book) => book.id));
        const newUniqueBooks = data.results.filter((book) => !existingIds.has(book.id));
        return [...previous, ...newUniqueBooks];
      });

      // Update next page pointer and hasMore flag
      nextUrlRef.current = data.next;
      setHasMore(data.next !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch book catalog.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Fetch Commercial Books from MongoDB
  const fetchCommercialBooks = useCallback(async () => {
    setLoadingCommercial(true);
    try {
      const res = await api.get('/api/books');
      if (res.data?.success && res.data?.data && res.data.data.length > 0) {
        setCommercialBooks(res.data.data);
      }
    } catch {
      // Fallback to sample books
    } finally {
      setLoadingCommercial(false);
    }
  }, []);

  // Reset & re-fetch Gutendex catalog when search or genre changes
  useEffect(() => {
    const initialUrl = buildInitialUrl(searchQuery, selectedGenre);
    nextUrlRef.current = initialUrl;
    loadingRef.current = false;
    setGutendexBooks([]);
    setHasMore(true);
    setError(null);

    // Initial fetch for the new parameters
    loadMoreGutendex();
  }, [searchQuery, selectedGenre, buildInitialUrl, loadMoreGutendex]);

  // Load commercial books on mount
  useEffect(() => {
    fetchCommercialBooks();
  }, [fetchCommercialBooks]);

  // Set up IntersectionObserver for Infinite Scrolling Sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || error || activeTab !== 'gutendex') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) {
          void loadMoreGutendex();
        }
      },
      {
        rootMargin: '300px', // Pre-fetch 300px before reaching the bottom
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreGutendex, hasMore, error, activeTab]);

  // Client-side sorting for Gutendex books
  const sortedGutendexBooks = React.useMemo(() => {
    const list = [...gutendexBooks];
    if (sortBy === 'popular') {
      return list.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'id') {
      return list.sort((a, b) => a.id - b.id);
    }
    return list;
  }, [gutendexBooks, sortBy]);

  // Filter commercial books by search query and genre
  const filteredCommercialBooks = React.useMemo(() => {
    return commercialBooks.filter((book) => {
      const matchesQuery =
        !searchQuery ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenre =
        !selectedGenre ||
        selectedGenre === 'all' ||
        book.genre.toLowerCase().includes(selectedGenre.toLowerCase());

      return matchesQuery && matchesGenre;
    });
  }, [commercialBooks, searchQuery, selectedGenre]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Catalog Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Book Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse live ebooks with infinite scrolling or explore commercial stock.
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'gutendex' | 'commercial')}
          items={[
            {
              key: 'gutendex',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <BookOutlined />
                  <span>Gutenberg Ebooks</span>
                  {totalApiCount !== null && (
                    <Badge count={totalApiCount} overflowCount={9999} style={{ backgroundColor: '#7c3aed' }} />
                  )}
                </span>
              ),
            },
            {
              key: 'commercial',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShopOutlined />
                  <span>Commercial Store</span>
                  <Badge count={commercialBooks.length} style={{ backgroundColor: '#f59e0b' }} />
                </span>
              ),
            },
          ]}
          className="mb-0"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by book title or author..."
            prefix={<SearchOutlined className="text-gray-400 mr-1" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="large"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Genre Quick Select */}
          <Select
            value={selectedGenre}
            onChange={setSelectedGenre}
            size="large"
            className="w-40"
            options={[
              { value: 'all', label: 'All Genres' },
              { value: 'fiction', label: 'Fiction' },
              { value: 'classics', label: 'Classics' },
              { value: 'science', label: 'Science' },
              { value: 'history', label: 'History' },
              { value: 'philosophy', label: 'Philosophy' },
              { value: 'poetry', label: 'Poetry' },
            ]}
          />

          {/* Sort By Select */}
          <Select
            value={sortBy}
            onChange={setSortBy}
            size="large"
            className="w-44"
            options={[
              { value: 'popular', label: 'Sort: Most Popular' },
              { value: 'title', label: 'Sort: Title (A-Z)' },
              { value: 'id', label: 'Sort: Book ID' },
            ]}
          />

          {(searchQuery || selectedGenre !== 'all') && (
            <Tooltip title="Reset filters">
              <Button
                icon={<ClearOutlined />}
                size="large"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Category Hierarchy (Tree DSA) */}
        <div className="lg:col-span-1 space-y-4">
          <CategoryTree
            selectedCategory={selectedGenre}
            onSelectCategory={(category) => setSelectedGenre(category)}
          />

          {/* Info card explaining Infinite Scroll */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 text-xs space-y-2 text-purple-900">
            <div className="font-bold flex items-center gap-1.5 text-purple-800">
              <FilterOutlined /> Infinite Scroll Tech
            </div>
            <p className="text-gray-600 leading-relaxed">
              Implemented using standard <code>IntersectionObserver</code>. Follows Gutendex <code>next</code> URLs without guessing page indices. Deduplicated in O(1) via <code>Set</code>.
            </p>
            <div className="pt-1 font-mono text-[11px] text-purple-700">
              Loaded: <b>{activeTab === 'gutendex' ? gutendexBooks.length : filteredCommercialBooks.length}</b> books
            </div>
          </div>
        </div>

        {/* Right Content: Books Grid */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'gutendex' ? (
            /* Gutendex Infinite Scroll Catalog */
            <>
              {error && (
                <Alert
                  type="error"
                  message="Failed to load catalog"
                  description={error}
                  showIcon
                  action={
                    <Button
                      size="small"
                      danger
                      icon={<ReloadOutlined />}
                      onClick={() => void loadMoreGutendex()}
                      loading={loading}
                    >
                      Retry
                    </Button>
                  }
                  className="rounded-xl"
                />
              )}

              {gutendexBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedGutendexBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : !loading && !error ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                  <Empty
                    description={
                      <span>
                        No books found matching &quot;{searchQuery}&quot;.
                      </span>
                    }
                  >
                    <Button type="primary" onClick={handleClearFilters} className="bg-violet-600">
                      Clear Search Filters
                    </Button>
                  </Empty>
                </div>
              ) : null}

              {/* Infinite Scroll Sentinel element */}
              <div ref={sentinelRef} style={{ height: 1 }} />

              {/* Loading Indicator for next batches */}
              {loading && (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2" aria-live="polite">
                  <Spin size="large" />
                  <span className="text-sm text-gray-500 font-medium">
                    Loading more books from Project Gutenberg...
                  </span>
                </div>
              )}

              {/* End of Catalog notification */}
              {!hasMore && gutendexBooks.length > 0 && (
                <div className="py-8 text-center border-t border-gray-200 text-sm text-gray-500">
                  🎉 You have reached the end of the available catalog!
                </div>
              )}
            </>
          ) : (
            /* Commercial Inventory View */
            <>
              {loadingCommercial ? (
                <div className="py-16 text-center">
                  <Spin size="large" tip="Loading commercial books..." />
                </div>
              ) : filteredCommercialBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCommercialBooks.map((book) => (
                    <CommercialBookCard key={book.isbn || book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                  <Empty description="No commercial books found matching criteria." />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <Spin size="large" tip="Loading book catalog..." />
        </div>
      }
    >
      <BooksCatalogContent />
    </Suspense>
  );
}
