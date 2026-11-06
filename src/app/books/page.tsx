'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Input,
  Select,
  Button,
  Spin,
  Empty,
  Alert,
  Tabs,
  Badge,
  Slider,
  AutoComplete,
  Pagination,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  BookOutlined,
  ShopOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import BookCard from '@/components/books/BookCard';
import CommercialBookCard from '@/components/books/CommercialBookCard';
import CategoryTree from '@/components/books/CategoryTree';
import { GutendexBook, GutendexApiResponse, ICommercialBook } from '@/types';
import api from '@/lib/axios';
import { PaginationStack } from '@/lib/dsa';
import {
  SEARCH_SUGGESTIONS,
  buildGutendexUrl,
} from '@/lib/gutendexCatalog';
import { BOOK_PAGE_SIZE } from '@/lib/catalogSeed';

const RECENT_SEARCH_KEY = 'bookstore_recent_searches';

function BooksCatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialGenre = searchParams.get('genre') || 'all';
  const initialTab = searchParams.get('tab') === 'gutendex' ? 'gutendex' : 'commercial';
  const initialSort = searchParams.get('sort') || 'popular';
  const initialMin = Number(searchParams.get('minPrice') || 0);
  const initialMax = Number(searchParams.get('maxPrice') || 100);
  const initialPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);

  const [activeTab, setActiveTab] = useState<'gutendex' | 'commercial'>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [submittedQuery, setSubmittedQuery] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [sortBy, setSortBy] = useState(initialSort);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number.isFinite(initialMin) ? initialMin : 0,
    Number.isFinite(initialMax) ? initialMax : 100,
  ]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>(priceRange);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [gutendexBooks, setGutendexBooks] = useState<GutendexBook[]>([]);
  const [totalApiCount, setTotalApiCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [commercialBooks, setCommercialBooks] = useState<ICommercialBook[]>([]);
  const [commercialPage, setCommercialPage] = useState(initialPage);
  const [commercialTotal, setCommercialTotal] = useState(0);
  const [commercialTotalPages, setCommercialTotalPages] = useState(1);
  const [loadingCommercial, setLoadingCommercial] = useState(false);
  const [commercialError, setCommercialError] = useState<string | null>(null);
  const [commercialFallback, setCommercialFallback] = useState(false);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 100 });

  const nextUrlRef = useRef<string | null>(buildGutendexUrl(initialSearch, initialGenre));
  const loadingRef = useRef<boolean>(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const pageStackRef = useRef(new PaginationStack<ICommercialBook>());
  const commercialRequestRef = useRef(0);
  const catalogBootstrappedRef = useRef(false);
  const initialPageRef = useRef(initialPage);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) || '[]');
      if (Array.isArray(stored)) setRecentSearches(stored.filter((item) => typeof item === 'string').slice(0, 6));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const syncUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(overrides).forEach(([key, value]) => {
        if (!value || (value === 'popular' && key === 'sort') || (value === 'all' && key === 'genre') || (value === '1' && key === 'page') || (value === 'commercial' && key === 'tab')) {
          if (key === 'sort' && value === 'popular') params.delete(key);
          else if (key === 'tab' && (value === 'commercial' || !value)) params.delete(key);
          else if (key === 'page' && value === '1') params.delete(key);
          else if (!value || value === 'all') params.delete(key);
          else params.set(key, value);
        } else {
          params.set(key, value);
        }
      });
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const loadMoreGutendex = useCallback(async () => {
    const url = nextUrlRef.current;
    if (!url || loadingRef.current) return;

    const controller = new AbortController();
    const requestId = requestIdRef.current;
    requestControllerRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gutendex?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
      });
      const data = (await response.json()) as GutendexApiResponse & { message?: string };
      if (controller.signal.aborted || requestIdRef.current !== requestId) return;
      if (!response.ok || !Array.isArray(data.results)) {
        throw new Error(data.message || 'Unable to load books from the live catalog.');
      }

      setTotalApiCount(data.count);
      setGutendexBooks((previous) => {
        const existingIds = new Set(previous.map((book) => book.id));
        const newUniqueBooks = data.results.filter((book) => {
          if (existingIds.has(book.id)) return false;
          existingIds.add(book.id);
          return true;
        });
        return [...previous, ...newUniqueBooks];
      });
      nextUrlRef.current = data.next;
      setHasMore(Boolean(data.next));
    } catch (err) {
      if (!controller.signal.aborted && requestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : 'Failed to fetch the book catalog.');
        setHasMore(false);
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  const fetchCommercialPage = useCallback(
    async (page: number, mode: 'reset' | 'push' | 'jump' = 'reset') => {
      const requestId = ++commercialRequestRef.current;
      setLoadingCommercial(true);
      try {
        const res = await api.get('/api/books', {
          params: {
            page,
            pageSize: BOOK_PAGE_SIZE,
            search: submittedQuery || undefined,
            genre: selectedGenre !== 'all' ? selectedGenre : undefined,
            sort: sortBy,
            minPrice: appliedPriceRange[0],
            maxPrice: appliedPriceRange[1],
            inStock: sortBy === 'in-stock' ? 'true' : undefined,
          },
        });
        if (requestId !== commercialRequestRef.current) return;
        if (!res.data?.success || !Array.isArray(res.data?.data)) {
          throw new Error(res.data?.message || 'Unable to load store books.');
        }

        const pageBooks = res.data.data as ICommercialBook[];
        const nextPage = Number(res.data.page) || page;
        if (mode === 'push') {
          pageStackRef.current.push(pageBooks);
        } else {
          pageStackRef.current.reset(pageBooks);
        }

        setCommercialBooks(pageBooks);
        setCommercialPage(nextPage);
        setCommercialTotal(Number(res.data.total) || pageBooks.length);
        setCommercialTotalPages(Number(res.data.totalPages) || 1);
        setCommercialFallback(Boolean(res.data.fallback));
        setCommercialError(res.data.fallback ? res.data.warning : null);
        if (pageBooks.length > 0) {
          const prices = pageBooks.map((book) => book.price);
          setPriceBounds((current) => ({
            min: Math.min(current.min, Math.floor(Math.min(...prices))),
            max: Math.max(current.max, Math.ceil(Math.max(...prices))),
          }));
        }
      } catch (err) {
        if (requestId !== commercialRequestRef.current) return;
        setCommercialBooks([]);
        setCommercialFallback(false);
        setCommercialError(err instanceof Error ? err.message : 'Unable to load store books.');
      } finally {
        if (requestId === commercialRequestRef.current) {
          setLoadingCommercial(false);
        }
      }
    },
    [appliedPriceRange, selectedGenre, sortBy, submittedQuery]
  );

  const handleStackPageChange = (nextPage: number) => {
    if (nextPage === commercialPage || loadingCommercial) return;

    if (nextPage === commercialPage - 1 && pageStackRef.current.depth() > 1) {
      const previous = pageStackRef.current.pop() || [];
      setCommercialBooks(previous);
      setCommercialPage(nextPage);
      syncUrl({ page: String(nextPage), tab: 'commercial' });
      return;
    }

    if (nextPage === commercialPage + 1) {
      void fetchCommercialPage(nextPage, 'push');
      return;
    }

    void fetchCommercialPage(nextPage, 'jump');
  };

  useEffect(() => {
    requestControllerRef.current?.abort();
    requestIdRef.current += 1;
    nextUrlRef.current = buildGutendexUrl(submittedQuery, selectedGenre);
    loadingRef.current = false;
    setGutendexBooks([]);
    setHasMore(true);
    setError(null);
    setTotalApiCount(null);
    if (activeTab === 'gutendex') {
      void loadMoreGutendex();
    }
    return () => {
      requestControllerRef.current?.abort();
    };
  }, [submittedQuery, selectedGenre, loadMoreGutendex, activeTab]);

  useEffect(() => {
    if (activeTab !== 'commercial') return;
    const page = catalogBootstrappedRef.current ? 1 : initialPageRef.current;
    catalogBootstrappedRef.current = true;
    pageStackRef.current.reset();
    void fetchCommercialPage(page, 'reset');
  }, [activeTab, submittedQuery, selectedGenre, sortBy, appliedPriceRange, fetchCommercialPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || error || activeTab !== 'gutendex') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) {
          void loadMoreGutendex();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreGutendex, hasMore, error, activeTab, gutendexBooks.length, loading]);

  const sortedGutendexBooks = React.useMemo(() => {
    const list = [...gutendexBooks];
    if (sortBy === 'title-desc') return list.sort((a, b) => b.title.localeCompare(a.title));
    if (sortBy === 'title' || sortBy === 'title-asc') return list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'author') {
      return list.sort((a, b) =>
        (a.authors[0]?.name || '').localeCompare(b.authors[0]?.name || '')
      );
    }
    return list.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
  }, [gutendexBooks, sortBy]);

  const rememberSearch = (value: string) => {
    const next = [value, ...recentSearches.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 6);
    setRecentSearches(next);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  };

  const handleSearchSubmit = (value: string) => {
    const next = value.trim();
    setSearchQuery(next);
    setSubmittedQuery(next);
    if (next) rememberSearch(next);
    syncUrl({ search: next, genre: selectedGenre, tab: activeTab, sort: sortBy, page: '1' });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSubmittedQuery('');
    setSelectedGenre('all');
    setSortBy('popular');
    setPriceRange([priceBounds.min, priceBounds.max]);
    setAppliedPriceRange([priceBounds.min, priceBounds.max]);
    syncUrl({ search: '', genre: 'all', tab: activeTab, sort: 'popular', minPrice: '', maxPrice: '', page: '1' });
  };

  const suggestionOptions = Array.from(
    new Set([...recentSearches, ...SEARCH_SUGGESTIONS])
  ).map((value) => ({ value }));

  const rangeStart = commercialTotal === 0 ? 0 : (commercialPage - 1) * BOOK_PAGE_SIZE + 1;
  const rangeEnd = Math.min(commercialPage * BOOK_PAGE_SIZE, commercialTotal);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Book catalog</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse store inventory 20 books at a time, then open the next page for the next 20.
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            const next = key as 'gutendex' | 'commercial';
            setActiveTab(next);
            syncUrl({ tab: next === 'gutendex' ? 'gutendex' : 'commercial', page: '1' });
          }}
          items={[
            {
              key: 'commercial',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShopOutlined />
                  <span>Shop books</span>
                  <Badge count={commercialTotal} overflowCount={9999} style={{ backgroundColor: '#f59e0b' }} />
                </span>
              ),
            },
            {
              key: 'gutendex',
              label: (
                <span className="flex items-center gap-1.5 font-semibold">
                  <BookOutlined />
                  <span>Free classics</span>
                  {totalApiCount !== null && (
                    <Badge count={totalApiCount} overflowCount={9999} style={{ backgroundColor: '#7c3aed' }} />
                  )}
                </span>
              ),
            },
          ]}
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex-1">
          <AutoComplete
            options={suggestionOptions}
            className="w-full"
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleSearchSubmit}
          >
            <Input.Search
              placeholder="Search by title, author, or genre"
              prefix={<SearchOutlined className="mr-1 text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearchSubmit}
              enterButton="Search"
              allowClear
              size="large"
              aria-label="Search books"
            />
          </AutoComplete>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedGenre}
            onChange={(value) => {
              setSelectedGenre(value);
              syncUrl({ genre: value, search: submittedQuery, tab: activeTab, page: '1' });
            }}
            size="large"
            className="w-40"
            aria-label="Filter by genre"
            options={[
              { value: 'all', label: 'All genres' },
              { value: 'fiction', label: 'Fiction' },
              { value: 'classics', label: 'Classics' },
              { value: 'fantasy', label: 'Fantasy' },
              { value: 'sci-fi', label: 'Science fiction' },
              { value: 'mystery', label: 'Mystery' },
              { value: 'science', label: 'Science' },
              { value: 'history', label: 'History' },
              { value: 'philosophy', label: 'Philosophy' },
              { value: 'poetry', label: 'Poetry' },
            ]}
          />

          <Select
            value={sortBy}
            onChange={(value) => {
              setSortBy(value);
              syncUrl({ sort: value, page: '1' });
            }}
            size="large"
            className="w-48"
            aria-label="Sort books"
            options={
              activeTab === 'gutendex'
                ? [
                    { value: 'popular', label: 'Most popular' },
                    { value: 'title-asc', label: 'Title A–Z' },
                    { value: 'title-desc', label: 'Title Z–A' },
                    { value: 'author', label: 'Author' },
                  ]
                : [
                    { value: 'popular', label: 'Highest rated' },
                    { value: 'title-asc', label: 'Title A–Z' },
                    { value: 'title-desc', label: 'Title Z–A' },
                    { value: 'author', label: 'Author' },
                    { value: 'price-asc', label: 'Price: low to high' },
                    { value: 'price-desc', label: 'Price: high to low' },
                    { value: 'in-stock', label: 'In stock first' },
                  ]
            }
          />

          {(submittedQuery || selectedGenre !== 'all') && (
            <Button icon={<ClearOutlined />} size="large" onClick={handleClearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'commercial' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
            <span>Price range</span>
            <span>
              ${appliedPriceRange[0]} – ${appliedPriceRange[1]}
            </span>
          </div>
          <Slider
            range
            min={priceBounds.min}
            max={Math.max(priceBounds.max, priceBounds.min + 1)}
            value={priceRange}
            onChange={(value) => setPriceRange(value as [number, number])}
            onAfterChange={(value) => {
              const next = value as [number, number];
              setAppliedPriceRange(next);
              syncUrl({ minPrice: String(next[0]), maxPrice: String(next[1]), page: '1' });
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <CategoryTree
            selectedCategory={selectedGenre}
            onSelectCategory={(category) => {
              setSelectedGenre(category);
              syncUrl({ genre: category, page: '1' });
            }}
          />
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs text-violet-900">
            <div className="mb-1 font-bold">
              {activeTab === 'gutendex' ? 'Free to read' : 'Store inventory'}
            </div>
            <p className="leading-relaxed text-gray-600">
              {activeTab === 'gutendex'
                ? 'Public-domain classics can be read online or downloaded when a file is available.'
                : 'Books are stored in the database and loaded 20 at a time with stack pagination.'}
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {activeTab === 'gutendex' ? (
            <>
              {error && (
                <Alert
                  type="error"
                  message="Unable to load the live catalog"
                  description={error}
                  showIcon
                  action={
                    <Button size="small" danger icon={<ReloadOutlined />} onClick={() => {
                      setHasMore(true);
                      setError(null);
                      void loadMoreGutendex();
                    }} loading={loading}>
                      Retry
                    </Button>
                  }
                />
              )}

              {gutendexBooks.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedGutendexBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : !loading && !error ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                  <Empty
                    description={
                      submittedQuery
                        ? `No books found matching “${submittedQuery}”.`
                        : 'No books found for these filters.'
                    }
                  >
                    <Button type="primary" onClick={handleClearFilters} className="bg-violet-600">
                      Clear search filters
                    </Button>
                  </Empty>
                </div>
              ) : null}

              <div ref={sentinelRef} style={{ height: 1 }} />

              {loading && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center" aria-live="polite">
                  <Spin size="large" />
                  <span className="text-sm font-medium text-gray-500">Loading books...</span>
                </div>
              )}

              {!hasMore && gutendexBooks.length > 0 && (
                <div className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
                  You have reached the end of this catalog.
                </div>
              )}
            </>
          ) : (
            <>
              {commercialError && (
                <Alert
                  type={commercialFallback ? 'warning' : 'error'}
                  showIcon
                  message={commercialFallback ? 'Generated catalog' : 'Store inventory unavailable'}
                  description={commercialError}
                  action={
                    <Button size="small" icon={<ReloadOutlined />} onClick={() => void fetchCommercialPage(commercialPage, 'jump')} loading={loadingCommercial}>
                      Retry
                    </Button>
                  }
                />
              )}
              {loadingCommercial && commercialBooks.length === 0 ? (
                <div className="py-16 text-center">
                  <Spin size="large" />
                </div>
              ) : commercialBooks.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                    <span>
                      Showing {rangeStart}–{rangeEnd} of {commercialTotal} books
                    </span>
                    <span>
                      Page {commercialPage} of {commercialTotalPages} · 20 per page
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {commercialBooks.map((book) => (
                      <CommercialBookCard key={book.isbn || book.id} book={book} />
                    ))}
                  </div>
                  <div className="flex justify-center py-4">
                    <Pagination
                      current={commercialPage}
                      total={commercialTotal}
                      pageSize={BOOK_PAGE_SIZE}
                      showSizeChanger={false}
                      onChange={handleStackPageChange}
                    />
                  </div>
                </>
              ) : commercialError && !commercialFallback ? null : (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                  <Empty
                    description={
                      commercialTotal === 0
                        ? 'No store books are currently available.'
                        : 'No store books match these filters.'
                    }
                  >
                    <Button onClick={handleClearFilters}>Clear filters</Button>
                  </Empty>
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
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <Spin size="large" />
        </div>
      }
    >
      <BooksCatalogContent />
    </Suspense>
  );
}
