'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Empty, Pagination, Select, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import api, { isCanceledRequest } from '@/lib/axios';
import StoreBookCard, { StoreBook } from '@/components/books/StoreBookCard';
import { designTokens } from '@/lib/designTokens';

const PAGE_SIZE = 20;

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
      const res = await api.get('/api/books', {
        signal,
        params: {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          sort,
        },
      });
      if (requestId !== requestIdRef.current) return;
      if (!res.data?.success || !Array.isArray(res.data.data)) {
        throw new Error(res.data?.message || 'Unable to load books.');
      }
      if (res.data.data.length > PAGE_SIZE) {
        throw new Error('Catalog page exceeded the 20-book limit.');
      }
      setBooks(res.data.data as StoreBook[]);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-[1366px] px-4 py-7 sm:px-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-semibold text-[var(--foreground)]">
            Books <span className="text-[15px] font-normal text-[var(--muted)]">({total} Items)</span>
          </h1>
          <Select
            value={sort}
            onChange={(value) => setQuery({ sort: value }, true)}
            className="w-48"
            options={[
              { value: 'relevance', label: 'Sort by relevance' },
              { value: 'popular', label: 'Popularity' },
              { value: 'price-asc', label: 'Price: low to high' },
              { value: 'price-desc', label: 'Price: high to low' },
              { value: 'rating', label: 'Rating' },
              { value: 'title', label: 'Title' },
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
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {books.map((book) => {
              const id = String(book._id || book.id);
              return <StoreBookCard key={id} book={book} />;
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
          <div className="mt-10 flex flex-col items-center gap-3">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              showSizeChanger={false}
              showQuickJumper
              onChange={(nextPage) => setQuery({ page: nextPage })}
              itemRender={(current, type, original) => {
                if (type === 'prev') {
                  return (
                    <Button disabled={page <= 1} aria-label="Previous page">
                      Previous
                    </Button>
                  );
                }
                if (type === 'next') {
                  return (
                    <Button disabled={page >= totalPages} aria-label="Next page">
                      Next
                    </Button>
                  );
                }
                return original;
              }}
            />
            <p className="text-sm text-[#767676]">
              Page {page} of {totalPages}
            </p>
          </div>
        ) : null}
      </div>
      <style jsx global>{`
        .ant-select-selector {
          border-radius: ${designTokens.radius.button}px !important;
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
