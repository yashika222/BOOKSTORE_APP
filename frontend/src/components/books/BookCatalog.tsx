'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Empty, Select, Spin } from 'antd';
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { booksService, isCanceledRequest } from '@/lib/api';
import StoreBookCard, { StoreBook } from '@/components/books/StoreBookCard';

const PAGE_SIZE = 20;

type PageItem = number | 'ellipsis';

function getPageItems(currentPage: number, pageCount: number): PageItem[] {
  if (pageCount <= 9) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 5) {
    return [...Array.from({ length: 8 }, (_, index) => index + 1), 'ellipsis', pageCount];
  }

  const firstVisible = Math.max(2, Math.min(currentPage - 3, pageCount - 7));
  const lastVisible = firstVisible + 6;

  return [
    1,
    ...(firstVisible > 2 ? ['ellipsis' as const] : []),
    ...Array.from({ length: lastVisible - firstVisible + 1 }, (_, index) => firstVisible + index),
    ...(lastVisible < pageCount - 1 ? ['ellipsis' as const] : []),
    pageCount,
  ];
}

function CatalogInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const sort = searchParams.get('sort') || 'relevance';

  const [books, setBooks] = useState<StoreBook[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const pageItems = getPageItems(page, totalPages);

  const setQuery = useCallback(
    (updates: Record<string, string | number | undefined>, resetPage = false) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'All') params.delete(key);
        else params.set(key, String(value));
      });
      if (resetPage) params.set('page', '1');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: true });
    },
    [pathname, router, searchParams]
  );

  const loadPage = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await booksService.list(
        {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          sort,
        },
        signal
      );
      if (requestId !== requestIdRef.current) return;
      if (!res?.success || !Array.isArray(res.data)) {
        throw new Error(res?.message || 'Unable to load books.');
      }
      if (res.data.length > PAGE_SIZE) {
        throw new Error('Catalog page exceeded the 20-book limit.');
      }
      setBooks(res.data as StoreBook[]);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      if (isCanceledRequest(err) || requestId !== requestIdRef.current) return;
      setBooks([]);
      setError(err instanceof Error ? err.message : 'Unable to load books.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [category, page, search, sort]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  return (
    <div className="customer-page min-h-screen bg-[var(--background)]">
      <div className="mx-auto box-border w-full max-w-[1024px] px-4 pb-12 pt-[22px] lg:px-0">
        <div className="mb-[30px] flex items-center justify-between gap-4 pl-[3px]">
          <h1 className="m-0 text-[25px] font-normal leading-[33px] text-[var(--foreground)]">
            Books <span className="relative -top-[1.5px] ml-[1.5px] text-[12px] font-normal leading-4 text-[var(--muted)]">({total} Items)</span>
          </h1>
          <Select
            value={sort}
            onChange={(value) => setQuery({ sort: value }, true)}
            className="catalog-sort mr-1.5 h-[30px] w-[161px] shrink-0"
            options={[
              { value: 'relevance', label: 'Sort by relevance' },
              { value: 'price-asc', label: 'Price : Low to High' },
              { value: 'price-desc', label: 'Price : High to Low' },
              { value: 'newest', label: 'Newest Arrivals' },
            ]}
          />
        </div>

        {error ? (
          <Alert
            type="error"
            showIcon
            message="The catalog could not be loaded."
            description={error}
            action={
              <Button icon={<ReloadOutlined />} onClick={() => void loadPage()}>
                Retry
              </Button>
            }
          />
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : books.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:max-w-[1018px] lg:grid-cols-4 lg:gap-[26px]">
            {books.map((book, index) => {
              const id = String(book._id || book.id);
              return <StoreBookCard key={id} book={book} imageLoading={index < 8 ? 'eager' : 'lazy'} />;
            })}
          </div>
        ) : !error ? (
          <Empty
            description={
              search || category !== 'All'
                ? 'No books match these filters.'
                : 'The database has no books yet. Run npm run import:books after MongoDB is connected.'
            }
          />
        ) : null}

        {totalPages > 0 && books.length > 0 ? (
          <nav className="mt-12 flex items-center justify-center gap-1 sm:gap-3" aria-label="Catalog pages">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setQuery({ page: page - 1 })}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1px] border-solid border-[#e5e5e5] bg-white text-[#333] transition-colors hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#d4d4d4]"
            >
              <LeftOutlined aria-hidden="true" />
            </button>
            {pageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  aria-hidden="true"
                  className="flex h-9 min-w-5 items-center justify-center text-[12px] text-[#878787]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-label={`Page ${item}`}
                  aria-current={page === item ? 'page' : undefined}
                  onClick={() => setQuery({ page: item })}
                  className={`flex h-9 min-w-[34px] items-center justify-center px-2 text-[12px] transition-colors ${
                    item !== 1 && item !== page && item !== page + 1 && item !== totalPages ? 'max-sm:hidden' : ''
                  } ${
                    page === item
                      ? 'border-[1px] border-solid border-[var(--primary)] bg-[var(--primary)] font-semibold text-white'
                      : 'border-[1px] border-solid border-transparent bg-transparent text-[#878787] hover:text-[var(--primary)]'
                  }`}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => setQuery({ page: page + 1 })}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1px] border-solid border-[#e5e5e5] bg-white text-[#333] transition-colors hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#d4d4d4]"
            >
              <RightOutlined aria-hidden="true" />
            </button>
          </nav>
        ) : null}
      </div>
      <style jsx global>{`
        .catalog-sort.ant-select {
          height: 30px;
        }

        .catalog-sort .ant-select-selector {
          height: 30px !important;
          padding: 0 14px !important;
          border: 1px solid #e2e2e2 !important;
          border-radius: 1px !important;
          box-shadow: none !important;
        }

        .catalog-sort .ant-select-selection-item {
          font-size: 12px !important;
          font-weight: 400;
          line-height: 28px !important;
        }

        .catalog-sort .ant-select-arrow {
          color: #0a0102;
        }
      `}</style>
    </div>
  );
}

export default function BookCatalog() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spin />
        </div>
      }
    >
      <CatalogInner />
    </Suspense>
  );
}
