'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, Spin, Empty, Button, Card, Divider } from 'antd';
import {
  FileTextOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import { IOrder } from '@/types';
import api from '@/lib/axios';

export default function OrdersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        api
          .get('/api/orders')
          .then((res) => {
            if (res.data?.success && res.data?.data) {
              setOrders(res.data.data);
            }
          })
          .catch(() => {
            // Error handling
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Delivered
          </Tag>
        );
      case 'shipped':
        return (
          <Tag color="processing" icon={<CarOutlined />}>
            Shipped
          </Tag>
        );
      case 'processing':
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Processing
          </Tag>
        );
      default:
        return (
          <Tag color="purple" icon={<ClockCircleOutlined />}>
            Order Placed (Queued)
          </Tag>
        );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Spin size="large" tip="Loading your order history..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-gray-200/80 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-2xl mx-auto">
            <UserOutlined />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Sign In to View Orders
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Please log in with your registered customer account to track and review all previous purchases saved in MongoDB.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/login">
              <Button type="primary" size="large" className="bg-violet-600 font-semibold">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="large" className="font-semibold">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Order History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tracking orders for <b className="text-gray-800">{user?.email}</b> (persisted in MongoDB).
          </p>
        </div>
        <Link href="/books">
          <Button icon={<ShoppingOutlined />} className="font-semibold">
            Explore More Books
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-200/80 shadow-sm text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  No orders found in your account
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Once you place a simulated order through our checkout, it will be saved here in MongoDB.
                </p>
              </div>
            }
          >
            <Link href="/books">
              <Button type="primary" size="large" className="bg-violet-600 mt-2">
                Start Shopping
              </Button>
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card
              key={order.orderId || order._id}
              className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden"
              bodyStyle={{ padding: 20 }}
            >
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-gray-900 font-mono">
                      {order.orderId}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-xs text-gray-500">Total Amount</div>
                  <div className="text-xl font-extrabold text-violet-700">
                    ${order.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="py-4 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className="w-12 h-16 bg-stone-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                      {item.coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-contain" />
                      ) : (
                        <FileTextOutlined className="text-gray-400 text-lg" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{item.title}</div>
                      <div className="text-xs text-gray-500">By {item.author}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        Quantity: <b>{item.quantity}</b> × ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold text-gray-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Footer */}
              <Divider className="my-2" />
              <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div>
                  Delivering to: <b className="text-gray-700">{order.shippingAddress.fullName}</b>, {order.shippingAddress.addressLine}, {order.shippingAddress.city} ({order.shippingAddress.postalCode})
                </div>
                {order.queuePosition !== undefined && (
                  <span className="font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                    Queue Position #{order.queuePosition}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
