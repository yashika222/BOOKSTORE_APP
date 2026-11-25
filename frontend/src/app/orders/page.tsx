'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Empty, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import type { IOrder, OrderItem, OrderStatus } from '@/types';
import { ordersService } from '@/lib/api';
import BookCoverImage from '@/components/books/BookCoverImage';
import { formatCurrency } from '@/lib/currency';

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'processing':
      return 'Order Processing';
    case 'shipped':
      return 'Order Shipped';
    case 'delivered':
      return 'Order Delivered';
    case 'cancelled':
      return 'Order Cancelled';
    default:
      return 'Order Placed';
  }
}

function formatOrderDate(date?: string) {
  if (!date) return 'Recently';

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Recently';

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
  });
}

function OrderItemCard({
  order,
  item,
}: {
  order: IOrder;
  item: OrderItem;
}) {
  const statusLabel = getStatusLabel(order.status);

  return (
    <article className="min-h-[130px] border border-[#e7e7e7] bg-white px-4 py-6 sm:px-[35px] sm:pb-[25px] sm:pt-[29px]">
      <div className="flex min-h-[74px] items-start gap-5 sm:gap-8">
        <Link
          href={`/books/${encodeURIComponent(String(item.bookId))}`}
          aria-label={`View ${item.title}`}
          className="flex h-[74px] w-[56px] shrink-0 items-center justify-center overflow-hidden border border-[#e2e2e2] bg-white"
        >
          <BookCoverImage
            src={item.coverImage}
            title={item.title}
            author={item.author}
            className="h-full w-full object-contain"
          />
        </Link>

        <div className="min-w-0 flex-1 pt-0.5">
          <Link
            href={`/books/${encodeURIComponent(String(item.bookId))}`}
            className="block truncate text-[16px] font-medium leading-5 text-[#222] hover:text-[#a03037]"
          >
            {item.title}
          </Link>
          <p className="mt-1 truncate text-[12px] leading-4 text-[#878787]">
            by {item.author}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[14px] leading-5">
            <span className="font-semibold text-[#333]">
              {formatCurrency(item.price * item.quantity)}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <s className="text-[11px] text-[#878787]">
                {formatCurrency(item.originalPrice * item.quantity)}
              </s>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 pt-0.5 text-[14px] font-semibold leading-5 text-[#333] sm:flex">
          <span
            aria-hidden="true"
            className={`h-[7px] w-[7px] rounded-full ${
              order.status === 'cancelled' ? 'bg-[#d14343]' : 'bg-[#35a853]'
            }`}
          />
          <span>
            {statusLabel} on {formatOrderDate(order.createdAt)}
          </span>
        </div>

        <div className="mt-auto flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-[#333] sm:hidden">
          <span
            aria-hidden="true"
            className={`h-[7px] w-[7px] rounded-full ${
              order.status === 'cancelled' ? 'bg-[#d14343]' : 'bg-[#35a853]'
            }`}
          />
          <span>
            {statusLabel} on {formatOrderDate(order.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.list();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Unable to load your order history.');
      }
      setOrders(data.data);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load your order history.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      void loadOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, loadOrders]);

  const pageContent = (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-8 pt-5 sm:px-0">
      <nav aria-label="Breadcrumb" className="mb-[11px] text-[11px] leading-[18px]">
        <Link href="/" className="text-[#878787] hover:text-[#a03037]">
          Home
        </Link>
        <span className="mx-1 text-[#a0a0a0]">/</span>
        <span className="text-[#333]">My Order</span>
      </nav>

      {error && (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message="Order history unavailable"
          description={error}
          action={
            <Button size="small" onClick={() => void loadOrders()}>
              Retry
            </Button>
          }
        />
      )}

      {!error && isAuthenticated && orders.length === 0 && !loading ? (
        <div className="border border-[#e7e7e7] bg-white px-4 py-12 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-[14px] text-[#666]">
                You have not placed any orders yet.
              </span>
            }
          >
            <Link href="/books">
              <Button type="primary" className="mt-2">
                Continue Shopping
              </Button>
            </Link>
          </Empty>
        </div>
      ) : isAuthenticated && !error ? (
        <div className="space-y-[18px]">
          {orders.flatMap((order) =>
            order.items.map((item, index) => (
              <OrderItemCard
                key={`${order.orderId || order._id}-${String(item.bookId)}-${index}`}
                order={order}
                item={item}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );

  if (authLoading || loading) {
    return (
      <main className="customer-page flex flex-1 flex-col">
        {pageContent}
        <div className="flex flex-1 justify-center pt-10">
          <Spin size="large" tip="Loading your order history..." />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="customer-page flex flex-1 flex-col">
        {pageContent}
        <div className="flex flex-1 items-start justify-center px-4 pt-5">
          <div className="w-full max-w-md border border-[#e7e7e7] bg-white p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5e6e8] text-xl text-[#a03037]">
              <UserOutlined />
            </div>
            <h1 className="text-lg font-semibold text-[#333]">
              Sign in to view your orders
            </h1>
            <p className="mt-2 text-sm text-[#666]">
              Log in to see the books you have ordered.
            </p>
            <Link href="/login?next=%2Forders">
              <Button type="primary" className="mt-5">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="customer-page flex flex-1 flex-col">
      {pageContent}
    </main>
  );
}
