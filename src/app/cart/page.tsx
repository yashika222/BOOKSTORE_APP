'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Empty,
  Table,
  InputNumber,
  Tag,
  Divider,
  Popconfirm,
  message,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  UndoOutlined,
  ShoppingOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { CartItem } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  removeFromCart,
  updateQuantity,
  undoRemove,
  clearCart,
} from '@/store/cartSlice';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.cart.items);
  const undoStack = useAppSelector((state) => state.cart.undoStack);

  // Subtotal calculated with reduce() (DSA requirement)
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  const shippingFee = subtotal > 35 || subtotal === 0 ? 0 : 4.99;
  const estimatedTax = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + shippingFee + estimatedTax).toFixed(2));

  const handleRemove = (bookId: string | number) => {
    dispatch(removeFromCart(bookId));
    message.info('Item removed. Click "Undo" to restore if needed.');
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      message.warning('Undo Stack is empty!');
      return;
    }
    dispatch(undoRemove());
    message.success('Restored previous cart state from Undo Stack (LIFO)');
  };

  const handleClear = () => {
    dispatch(clearCart());
    message.info('Cart cleared');
  };

  const columns: ColumnsType<CartItem> = [
    {
      title: 'Book Details',
      dataIndex: 'title',
      key: 'title',
      render: (_, item) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-16 rounded bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
            {item.coverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xl">📖</span>
            )}
          </div>
          <div>
            <Link
              href={`/books/${item.bookId}`}
              className="font-bold text-sm text-gray-900 hover:text-violet-600 transition-colors line-clamp-1"
            >
              {item.title}
            </Link>
            <div className="text-xs text-gray-500">By {item.author}</div>
            <div className="mt-1">
              {item.isCommercial ? (
                <Tag color="gold" className="text-[10px]">
                  Commercial
                </Tag>
              ) : (
                <Tag color="purple" className="text-[10px]">
                  Gutenberg Ebook
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="font-semibold text-gray-800">${price.toFixed(2)}</span>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'qty',
      key: 'qty',
      render: (qty: number, item) => (
        <InputNumber
          min={1}
          max={item.stock || 99}
          value={qty}
          onChange={(newVal) =>
            dispatch(updateQuantity({ bookId: item.bookId, qty: newVal || 1 }))
          }
          className="w-20"
        />
      ),
    },
    {
      title: 'Total',
      key: 'itemTotal',
      render: (_, item) => (
        <span className="font-bold text-violet-700">
          ${(item.price * item.qty).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, item) => (
        <Tooltip title="Remove item (saves to Undo Stack)">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemove(item.bookId)}
          />
        </Tooltip>
      ),
    },
  ];

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-12 border border-gray-200/80 shadow-sm space-y-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  Your shopping cart is currently empty
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                  Discover thousands of titles in our infinite catalog or check commercial bestsellers.
                </p>
              </div>
            }
          >
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/books">
                <Button type="primary" size="large" className="bg-violet-600">
                  Explore Catalog
                </Button>
              </Link>
              {undoStack.length > 0 && (
                <Button
                  size="large"
                  icon={<UndoOutlined />}
                  onClick={handleUndo}
                  className="font-medium"
                >
                  Undo Last Removal ({undoStack.length})
                </Button>
              )}
            </div>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your selected titles and proceed to checkout.
          </p>
        </div>

        {/* Undo Stack and Clear Actions */}
        <div className="flex items-center gap-2">
          {undoStack.length > 0 && (
            <Tooltip title="Restore deleted item from LIFO Stack">
              <Button
                icon={<UndoOutlined />}
                onClick={handleUndo}
                className="text-violet-700 border-violet-300 bg-violet-50 font-medium"
              >
                Undo Remove ({undoStack.length})
              </Button>
            </Tooltip>
          )}

          <Popconfirm
            title="Clear Shopping Cart"
            description="Are you sure you want to remove all items from your cart?"
            onConfirm={handleClear}
            okText="Yes, Clear"
            cancelText="Cancel"
          >
            <Button icon={<ClearOutlined />} danger>
              Clear Cart
            </Button>
          </Popconfirm>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={cartItems}
            rowKey={(record) => String(record.bookId)}
            pagination={false}
            scroll={{ x: 600 }}
          />
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            Order Summary
          </h2>

          <div className="space-y-2.5 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal ({cartItems.length} titles)</span>
              <span className="font-semibold text-gray-900">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span>
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-semibold">FREE</span>
                ) : (
                  `$${shippingFee.toFixed(2)}`
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Estimated Tax (5%)</span>
              <span>${estimatedTax.toFixed(2)}</span>
            </div>

            {shippingFee > 0 && (
              <p className="text-[11px] text-gray-400">
                Free shipping on orders over $35.00!
              </p>
            )}

            <Divider className="my-2" />

            <div className="flex justify-between text-base font-extrabold text-gray-900">
              <span>Total Amount</span>
              <span className="text-violet-700 text-xl">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            block
            icon={<ArrowRightOutlined />}
            onClick={() => router.push('/checkout')}
            className="bg-violet-600 hover:bg-violet-700 font-bold h-12 shadow-md flex items-center justify-center gap-2"
          >
            Proceed to Checkout
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/books"
              className="text-xs font-semibold text-gray-500 hover:text-violet-600 flex items-center justify-center gap-1"
            >
              <ShoppingOutlined /> Continue Shopping
            </Link>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 border border-gray-200/60 text-xs text-gray-500 space-y-1">
            <div className="font-semibold text-gray-700 flex items-center gap-1">
              <CheckCircleOutlined className="text-emerald-500" /> DSA in Cart:
            </div>
            <div>• <code>reduce()</code> computes subtotal and grand totals.</div>
            <div>• <code>Stack</code> keeps undo history when removing books.</div>
            <div>• <code>localStorage</code> persists your cart across reloads.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
