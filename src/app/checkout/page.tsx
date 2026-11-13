'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Form,
  Input,
  Button,
  Radio,
  Result,
  Divider,
  Alert,
  message,
  Spin,
} from 'antd';
import {
  ShoppingOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart } from '@/store/cartSlice';
import api from '@/lib/axios';
import { IOrder } from '@/types';
import BookCoverImage from '@/components/books/BookCoverImage';
import { formatCurrency, shippingFeeFor } from '@/lib/currency';

export default function CheckoutPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.cart.items);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const checkoutRequestId = useRef<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<IOrder | null>(null);

  // Subtotal calculated with reduce()
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingFee = shippingFeeFor(subtotal);
  const grandTotal = Number((subtotal + shippingFee).toFixed(2));

  const handleCheckoutSubmit = async (values: {
    fullName: string;
    email: string;
    phone: string;
    addressLine: string;
    city: string;
    state?: string;
    postalCode: string;
    country?: string;
    paymentMethod: string;
  }) => {
    if (cartItems.length === 0) {
      message.error('Your cart is empty');
      return;
    }

    setSubmitting(true);

    try {
      const requestStorageKey = `bookstore_checkout_request_${user?.id || 'account'}`;
      if (!checkoutRequestId.current) {
        checkoutRequestId.current =
          sessionStorage.getItem(requestStorageKey) || crypto.randomUUID();
        sessionStorage.setItem(requestStorageKey, checkoutRequestId.current);
      }

      const orderPayload = {
        requestId: checkoutRequestId.current,
        items: cartItems,
        shippingAddress: {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          addressLine: values.addressLine,
          city: values.city,
          state: values.state || '',
          postalCode: values.postalCode,
          country: values.country || 'India',
        },
        subtotal,
        shippingFee,
        total: grandTotal,
        paymentMethod: 'cash_on_delivery',
      };

      const response = await api.post('/api/orders', orderPayload);

      if (response.data?.success && response.data?.order) {
        setCompletedOrder(response.data.order);
        sessionStorage.removeItem(requestStorageKey);
        checkoutRequestId.current = null;
        dispatch(clearCart());
        message.success('Order placed successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to place order');
      }
    } catch (err: any) {
      message.error(err.message || 'An error occurred during checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  // If order was successfully created, show confirmation view
  if (completedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-md text-center space-y-6">
          <Result
            status="success"
            title={
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Order Placed Successfully!
              </span>
            }
            subTitle={
              <div className="space-y-1 text-sm text-gray-600 mt-2">
                <div>
                  Order Reference: <b className="text-gray-900 font-mono">{completedOrder.orderId}</b>
                </div>
                <div>
                  Your order has been saved to your BookStore account.
                </div>
              </div>
            }
            extra={[
              <Link href="/orders" key="orders">
                <Button
                  type="primary"
                  size="large"
                  icon={<HistoryOutlined />}
                  className="bg-violet-600 hover:bg-violet-700 font-semibold"
                >
                  View in Order History
                </Button>
              </Link>,
              <Link href="/books" key="catalog">
                <Button size="large" icon={<ShoppingOutlined />} className="font-semibold">
                  Continue Shopping
                </Button>
              </Link>,
            ]}
          />

        </div>
      </div>
    );
  }

  // If cart is empty, redirect or prompt user
  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="bg-white rounded-3xl p-10 border border-gray-200/80 shadow-sm space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
          <p className="text-sm text-gray-500">
            Please add books to your shopping cart before proceeding to checkout.
          </p>
          <div className="pt-2">
            <Link href="/books">
              <Button type="primary" size="large" className="bg-violet-600 font-semibold">
                Browse Books Catalog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Checkout
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete your order. Demo payments will not charge your card.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Form: Shipping Details */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              1. Shipping & Contact Information
            </h2>
            {!isAuthenticated && (
              <span className="text-xs text-gray-500">
                Already registered? <Link href="/login" className="text-violet-600 font-semibold">Log in</Link>
              </span>
            )}
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              fullName: user?.name || '',
              email: user?.email || '',
              paymentMethod: 'cash_on_delivery',
              country: 'India',
            }}
            onFinish={handleCheckoutSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input placeholder="e.g. John Doe" size="large" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input placeholder="e.g. john@example.com" size="large" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter contact phone' }]}
              >
                <Input placeholder="+91 9876543210" size="large" />
              </Form.Item>

              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please enter country' }]}
              >
                <Input placeholder="India" size="large" />
              </Form.Item>
            </div>

            <Form.Item
              name="addressLine"
              label="Street Address"
              rules={[{ required: true, message: 'Please enter street address' }]}
            >
              <Input placeholder="House/Flat No., Street, Landmark" size="large" />
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="e.g. New Delhi" size="large" />
              </Form.Item>

              <Form.Item
                name="postalCode"
                label="Postal / PIN Code"
                rules={[{ required: true, message: 'Please enter postal code' }]}
              >
                <Input placeholder="e.g. 110001" size="large" />
              </Form.Item>
            </div>

            <Divider className="my-6" />

            {/* Payment Method Option */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">
                2. Payment Method
              </h2>

              <Alert
                message="Cash on delivery"
                description="Payment is collected when the order is delivered. No online payment gateway is integrated."
                type="info"
                showIcon
                className="text-xs rounded-xl"
              />

              <Form.Item name="paymentMethod" className="pt-2">
                <Radio.Group className="w-full space-y-2">
                  <div className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                    <Radio value="cash_on_delivery">
                      <span className="font-semibold text-sm text-gray-800">
                        Cash on Delivery
                      </span>
                    </Radio>
                    <SafetyCertificateOutlined className="text-emerald-600 text-lg" />
                  </div>
                </Radio.Group>
              </Form.Item>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              block
              className="bg-violet-600 hover:bg-violet-700 font-extrabold h-12 text-base shadow-md mt-4"
            >
              Confirm & Place Order ({formatCurrency(grandTotal)})
            </Button>
          </Form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            Review Items ({cartItems.length})
          </h2>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={String(item.bookId)} className="flex items-center gap-3 text-sm">
                <div className="w-10 h-14 bg-stone-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                  <BookCoverImage
                    src={item.coverImage}
                    title={item.title}
                    author={item.author}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500">
                    Qty: {item.qty} × {formatCurrency(item.price)}
                  </div>
                </div>
                <div className="font-bold text-gray-800">
                  {formatCurrency(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          <Divider className="my-2" />

          {/* Pricing breakdown */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-semibold">FREE</span>
                ) : (
                  formatCurrency(shippingFee)
                )}
              </span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between text-base font-extrabold text-gray-900">
              <span>Grand Total</span>
              <span className="text-violet-700 text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
