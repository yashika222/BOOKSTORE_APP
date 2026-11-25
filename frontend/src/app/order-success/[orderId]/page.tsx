'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Spin } from 'antd';
import type { IOrder } from '@/types';
import { ordersService } from '@/lib/api';

const blueButtonStyle: React.CSSProperties = {
  backgroundColor: '#3371B5',
  borderColor: '#3371B5',
  color: '#fff',
};

function CelebrationArtwork() {
  return (
    <svg
      aria-label="Celebration"
      role="img"
      width="160"
      height="88"
      viewBox="0 0 160 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M30 12l14 18M14 37l16 5M48 4l8 18M130 12l-14 18M146 37l-16 5M112 4l-8 18" stroke="#F44336" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 8l9 16M90 14l-2 8M18 60l9-8M142 60l-9-8" stroke="#5C6BC0" strokeWidth="3" strokeLinecap="round" />
      <path d="M54 52l4 4 4-4M102 52l4 4 4-4" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80 34l4.8 9.7 10.7 1.6-7.7 7.5 1.8 10.6L80 58.4l-9.6 5 1.8-10.6-7.7-7.5 10.7-1.6L80 34z" fill="#FFC107" />
      <path d="M39 48l2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.5-4.4 6.3-.9L39 48zM121 48l2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.5-4.4 6.3-.9 2.8-5.7z" fill="#FFC107" />
      <circle cx="24" cy="18" r="3" fill="#5C6BC0" />
      <circle cx="136" cy="18" r="3" fill="#FF4081" />
      <circle cx="58" cy="26" r="3" fill="#FF4081" />
      <circle cx="102" cy="26" r="3" fill="#4CAF50" />
      <circle cx="27" cy="66" r="3" fill="#4CAF50" />
      <circle cx="133" cy="66" r="3" fill="#FFC107" />
    </svg>
  );
}

function CelebrationFinish() {
  return (
    <svg
      aria-hidden="true"
      width="100"
      height="38"
      viewBox="0 0 100 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M40 11v22M50 4v29M60 11v22" stroke="#5C6BC0" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 17v16M55 17v16" stroke="#F44336" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="20" r="3" fill="#4CAF50" />
      <circle cx="28" cy="12" r="2" fill="#FF4081" />
      <circle cx="72" cy="12" r="2" fill="#FFC107" />
      <circle cx="84" cy="20" r="3" fill="#5C6BC0" />
      <path d="M31 25l-3 4M69 25l3 4" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function OrderSuccessPage({
  params,
}: {
  params: { orderId: string };
}) {
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    ordersService
      .get(params.orderId)
      .then((data) => {
        if (!data.success || !data.data) {
          throw new Error(data.message || 'Unable to load your order.');
        }
        if (active) setOrder(data.data);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load your order.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.orderId]);

  return (
    <div className="customer-page mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center px-4 py-8 text-center">
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-24">
          <Spin size="large" />
          <span className="text-sm text-[#878787]">
            Loading your order confirmation...
          </span>
        </div>
      ) : error || !order ? (
        <div className="w-full max-w-xl py-16">
          <Alert
            type="error"
            showIcon
            message="Order confirmation unavailable"
            description={error || 'The requested order could not be found.'}
          />
          <Link href="/orders" className="mt-5 inline-block text-[#3371B5]">
            View your orders
          </Link>
        </div>
      ) : (
        <>
          <CelebrationArtwork />
          <h1 className="mt-3 text-[20px] font-semibold text-[#4d4d4d]">
            Order Placed Successfully
          </h1>
          <CelebrationFinish />
          <p className="mt-4 max-w-[420px] text-[14px] leading-5 text-[#4d4d4d]">
            Hurray!!! Your order is confirmed. The order ID is{' '}
            <span className="font-semibold text-[#0a0102]">#{order.orderId}</span>.
            Save the order ID for further communication.
          </p>

          <div className="mt-8 w-full max-w-[572px] overflow-hidden border border-[#e2e2e2] text-left">
            <div className="grid grid-cols-1 bg-[#fafafa] text-center text-[12px] font-medium text-[#4d4d4d] sm:grid-cols-3">
              <div className="border-b border-[#e2e2e2] px-3 py-2 sm:border-b-0 sm:border-r">
                Email us
              </div>
              <div className="border-b border-[#e2e2e2] px-3 py-2 sm:border-b-0 sm:border-r">
                Contact us
              </div>
              <div className="px-3 py-2">Address</div>
            </div>
            <div className="grid grid-cols-1 text-left text-[12px] leading-4 text-[#4d4d4d] sm:grid-cols-3">
              <div className="break-all border-b border-[#e2e2e2] px-6 py-3 sm:border-b-0 sm:border-r">
                {order.shippingAddress.email}
              </div>
              <div className="border-b border-[#e2e2e2] px-6 py-3 sm:border-b-0 sm:border-r">
                {order.shippingAddress.phone}
              </div>
              <div className="px-6 py-3">
                {order.shippingAddress.addressLine}, {order.shippingAddress.city}
                {order.shippingAddress.state
                  ? `, ${order.shippingAddress.state}`
                  : ''}
                {order.shippingAddress.postalCode
                  ? ` ${order.shippingAddress.postalCode}`
                  : ''}
              </div>
            </div>
          </div>

          <Link href="/books" className="mt-6">
            <Button
              style={blueButtonStyle}
              className="h-[28px] min-w-[152px] rounded-sm px-5 text-[12px] font-medium"
            >
              CONTINUE SHOPPING
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
