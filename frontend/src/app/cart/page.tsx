'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Tooltip,
} from 'antd';
import {
  DownOutlined,
  EnvironmentOutlined,
  MinusOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import BookCoverImage from '@/components/books/BookCoverImage';
import type { CartItem, IOrder } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearCart,
  removeFromCart,
  undoRemove,
  updateQuantity,
} from '@/store/cartSlice';
import { formatCurrency, shippingFeeFor } from '@/lib/currency';
import { confirmDestructiveAction } from '@/lib/confirmAction';
import { ordersService } from '@/lib/api';

interface AddressFormValues {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  addressType: 'Home' | 'Work' | 'Other';
}

type CheckoutStage = 'cart' | 'address' | 'summary';

const blueButtonStyle: React.CSSProperties = {
  backgroundColor: '#3371B5',
  borderColor: '#3371B5',
  color: '#fff',
};

function CartBookRow({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: (bookId: string | number) => void;
  onQuantityChange: (bookId: string | number, quantity: number) => void;
}) {
  const maxQuantity = item.stock && item.stock > 0 ? item.stock : 99;

  return (
    <div className="flex gap-8 border-b-[1px] border-solid border-[#f2f2f2] px-4 py-5 last:border-b-0 sm:px-[31px]">
      <Link
        href={`/books/${item.bookId}`}
        aria-label={`View ${item.title}`}
        className="flex h-[74px] w-[56px] shrink-0 items-center justify-center overflow-hidden border-[1px] border-solid border-[#e2e2e2] bg-white"
      >
        <BookCoverImage
          src={item.coverImage}
          title={item.title}
          author={item.author}
          className="h-full w-full object-contain"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/books/${item.bookId}`}
          className="block truncate text-[14px] font-medium leading-5 text-[#0a0102] no-underline"
        >
          {item.title}
        </Link>
        <div className="mt-0.5 truncate text-[11px] leading-4 text-[#878787]">
          by {item.author}
        </div>
        <div className="mt-1 flex items-baseline gap-2 leading-5">
          <span className="text-[14px] font-semibold text-[#0a0102]">
            {formatCurrency(item.price)}
          </span>
          {typeof item.originalPrice === 'number' &&
            item.originalPrice > item.price && (
              <s className="text-[10px] text-[#878787]">
                {formatCurrency(item.originalPrice)}
              </s>
            )}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              aria-label={`Decrease quantity of ${item.title}`}
              shape="circle"
              size="small"
              icon={<MinusOutlined />}
              disabled={item.qty <= 1}
              onClick={() => onQuantityChange(item.bookId, item.qty - 1)}
              className="!h-5 !w-5 !min-w-5 !p-0 !text-[10px]"
            />
            <InputNumber
              aria-label={`Quantity of ${item.title}`}
              controls={false}
              min={1}
              max={maxQuantity}
              value={item.qty}
              onChange={(value) => onQuantityChange(item.bookId, Number(value) || 1)}
              className="!h-[22px] !w-[36px] rounded-sm text-center"
            />
            <Button
              aria-label={`Increase quantity of ${item.title}`}
              shape="circle"
              size="small"
              icon={<PlusOutlined />}
              disabled={item.qty >= maxQuantity}
              onClick={() => onQuantityChange(item.bookId, item.qty + 1)}
              className="!h-5 !w-5 !min-w-5 !p-0 !text-[10px]"
            />
          </div>
          <Tooltip title="Remove item">
            <Button
              type="text"
              onClick={() => onRemove(item.bookId)}
              className="!h-auto !p-0 text-[12px] text-[#0a0102]"
            >
              Remove
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<AddressFormValues>();
  const addressRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const checkoutRequestId = useRef<string | null>(null);

  const cartItems = useAppSelector((state) => state.cart.items);
  const undoStack = useAppSelector((state) => state.cart.undoStack);
  const { user, isAuthenticated, isGuest } = useAppSelector((state) => state.auth);

  const [stage, setStage] = useState<CheckoutStage>('cart');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );
  const shippingFee = shippingFeeFor(subtotal);
  const grandTotal = Number((subtotal + shippingFee).toFixed(2));

  useEffect(() => {
    if (stage === 'address') {
      addressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (stage === 'summary') {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [stage]);

  const handleRemove = (bookId: string | number) => {
    void confirmDestructiveAction({
      title: 'Remove this book?',
      content: 'Are you sure you want to remove this book from your cart?',
      okText: 'Remove',
      onOk: () => {
        dispatch(removeFromCart(bookId));
        message.open({
          type: 'info',
          duration: 5,
          content: (
            <span className="inline-flex items-center gap-2">
              Item removed from cart.
              <Button
                type="link"
                size="small"
                onClick={handleUndo}
                className="!h-auto !p-0"
              >
                Undo
              </Button>
            </span>
          ),
        });
      },
    }).catch(() => undefined);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      message.warning('There are no recent removals to undo.');
      return;
    }
    dispatch(undoRemove());
    message.success('Item restored to your cart.');
  };

  const handlePlaceOrder = () => {
    if (!isAuthenticated || isGuest) {
      message.warning('Log in or create an account to place your order.');
      router.push(`/login?next=${encodeURIComponent('/cart')}`);
      return;
    }

    setStage('address');
  };

  const handleContinue = async () => {
    try {
      await form.validateFields();
      setStage('summary');
    } catch {
      // Ant Design displays the validation errors next to the fields.
    }
  };

  const handleCheckout = async () => {
    if (!user?.email) {
      message.error('Your account email is unavailable. Please sign in again.');
      return;
    }

    let values: AddressFormValues;
    try {
      values = await form.validateFields();
    } catch {
      setStage('address');
      return;
    }

    setSubmitting(true);

    try {
      const requestStorageKey = `bookstore_checkout_request_${user.id}`;
      if (!checkoutRequestId.current) {
        checkoutRequestId.current =
          sessionStorage.getItem(requestStorageKey) || crypto.randomUUID();
        sessionStorage.setItem(requestStorageKey, checkoutRequestId.current);
      }

      const response = await ordersService.create({
        requestId: checkoutRequestId.current,
        items: cartItems.map((item) => ({
          bookId: String(item.bookId),
          qty: item.qty,
          isCommercial: item.isCommercial,
        })),
        shippingAddress: {
          ...values,
          email: user.email,
          country: 'India',
        },
        subtotal,
        shippingFee,
        total: grandTotal,
        paymentMethod: 'cash_on_delivery',
      });

      if (!response.success || !response.order) {
        throw new Error(response.message || 'Unable to place your order.');
      }

      const orderId = response.order.orderId;
      sessionStorage.removeItem(requestStorageKey);
      checkoutRequestId.current = null;
      dispatch(clearCart());
      router.push(`/order-success/${encodeURIComponent(orderId)}`);
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : 'Unable to place your order right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="customer-page mx-auto box-border flex w-full max-w-[880px] flex-1 flex-col px-4 py-16 text-center sm:px-0">
        <div className="space-y-4 border-[1px] border-solid border-[#e2e2e2] bg-white p-12">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <h3 className="text-lg font-semibold text-[#0a0102]">
                  Your shopping cart is currently empty
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-[#878787]">
                  Explore the catalog and find your next read.
                </p>
              </div>
            }
          >
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/books">
                <Button style={blueButtonStyle} size="large">
                  Explore Books
                </Button>
              </Link>
              {undoStack.length > 0 && (
                <Button
                  size="large"
                  icon={<UndoOutlined />}
                  onClick={handleUndo}
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
    <div className="customer-page mx-auto box-border flex w-full max-w-[880px] flex-1 flex-col px-4 pb-8 pt-[17px] sm:px-0">
      <nav aria-label="Breadcrumb" className="mb-[9px] text-[11px] leading-[18px] text-[#878787]">
        <Link href="/" className="text-inherit hover:text-[#a03037]">
          Home
        </Link>
        <span className="mx-1">/</span>
        <span className="font-medium text-[#0a0102]">My cart</span>
      </nav>

      <section className="w-full max-w-[667px] border-[1px] border-solid border-[#e2e2e2] bg-white">
        <div className="flex min-h-[53px] flex-wrap items-start justify-between gap-3 pb-[2px] pl-[30px] pr-5 pt-[13px]">
          <h1 className="text-[15px] font-medium leading-5 text-[#0a0102]">
            My cart ({cartItems.length})
          </h1>
          <div className="flex h-[38px] w-full max-w-[238px] items-center justify-between gap-3 border-[1px] border-solid border-[#d8d8d8] px-3 text-[12px] text-[#0a0102]">
            <span className="flex items-center gap-2">
              <EnvironmentOutlined className="text-[#a03037]" />
              Use current location
            </span>
            <DownOutlined className="text-[10px] text-[#878787]" />
          </div>
        </div>

        {cartItems.map((item) => (
          <CartBookRow
            key={String(item.bookId)}
            item={item}
            onRemove={handleRemove}
            onQuantityChange={(bookId, qty) =>
              dispatch(updateQuantity({ bookId, qty }))
            }
          />
        ))}

        <div className="flex justify-end px-5 pb-[19px] pt-1.5">
          <Button
            onClick={handlePlaceOrder}
            style={blueButtonStyle}
            className="h-[30px] min-w-[130px] rounded-sm px-5 text-[12px] font-medium"
          >
            PLACE ORDER
          </Button>
        </div>

        <div className="border-t-[1px] border-solid border-[#f2f2f2]" />

        <div ref={addressRef} className="scroll-mt-20">
          <div className="flex min-h-[50px] items-center px-6">
            <span className="text-[15px] font-medium text-[#4d4d4d]">
              Address Details
            </span>
          </div>

          {stage !== 'cart' && (
            <div className="border-t-[1px] border-solid border-[#f2f2f2] px-6 pb-6 pt-4 sm:px-10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold text-[#4d4d4d]">
                  Customer Details
                </h2>
              </div>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  fullName: user?.name || '',
                  addressType: 'Home',
                }}
                requiredMark={false}
              >
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 sm:max-w-[680px]">
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: 'Enter your full name.' }]}
                    className="!mb-4"
                  >
                    <Input size="large" placeholder="Full name" />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    label="Mobile Number"
                    rules={[{ required: true, message: 'Enter your mobile number.' }]}
                    className="!mb-4"
                  >
                    <Input size="large" inputMode="tel" placeholder="Mobile number" />
                  </Form.Item>
                  <Form.Item
                    name="addressLine"
                    label="Address"
                    rules={[{ required: true, message: 'Enter your address.' }]}
                    className="!mb-4 sm:col-span-2"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="House/flat, street, locality"
                    />
                  </Form.Item>
                  <Form.Item
                    name="city"
                    label="City/Town"
                    rules={[{ required: true, message: 'Enter your city or town.' }]}
                    className="!mb-4"
                  >
                    <Input size="large" placeholder="City/Town" />
                  </Form.Item>
                  <Form.Item
                    name="state"
                    label="State"
                    rules={[{ required: true, message: 'Enter your state.' }]}
                    className="!mb-4"
                  >
                    <Input size="large" placeholder="State" />
                  </Form.Item>
                  <Form.Item
                    name="postalCode"
                    label="PIN Code"
                    rules={[{ required: true, message: 'Enter your PIN code.' }]}
                    className="!mb-4"
                  >
                    <Input size="large" inputMode="numeric" placeholder="PIN Code" />
                  </Form.Item>
                  <Form.Item
                    name="addressType"
                    label="Type"
                    className="!mb-4 sm:col-span-2"
                  >
                    <Radio.Group>
                      <Radio value="Home">Home</Radio>
                      <Radio value="Work">Work</Radio>
                      <Radio value="Other">Other</Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => void handleContinue()}
                    style={blueButtonStyle}
                    className="h-[38px] min-w-[160px] rounded-sm px-6 text-[14px] font-medium"
                  >
                    CONTINUE
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </div>

        <div className="border-t-[1px] border-solid border-[#f2f2f2]" />

        <div ref={summaryRef} className="scroll-mt-20">
          <div className="flex min-h-[50px] items-center px-6">
            <span className="text-[15px] font-medium text-[#4d4d4d]">
              Order summary
            </span>
          </div>

          {stage === 'summary' && (
            <div className="border-t border-[#f2f2f2] px-6 pb-6 pt-4 sm:px-10">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={String(item.bookId)}
                    className="flex items-center gap-5"
                  >
                    <div className="flex h-[72px] w-[54px] shrink-0 items-center justify-center overflow-hidden border-[1px] border-solid border-[#e2e2e2] bg-white">
                      <BookCoverImage
                        src={item.coverImage}
                        title={item.title}
                        author={item.author}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium text-[#0a0102]">
                        {item.title}
                      </div>
                      <div className="mt-1 text-[12px] text-[#878787]">
                        by {item.author}
                      </div>
                      <div className="mt-2 text-[14px] font-semibold text-[#0a0102]">
                        {formatCurrency(item.price)}
                        <span className="ml-3 text-[12px] font-normal text-[#878787]">
                          Qty: {item.qty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-[1px] border-solid border-[#f2f2f2] pt-4">
                <div className="text-[14px] text-[#4d4d4d]">
                  Total: <span className="font-semibold text-[#0a0102]">{formatCurrency(grandTotal)}</span>
                  {shippingFee > 0 && (
                    <span className="ml-2 text-[12px] text-[#878787]">
                      (includes {formatCurrency(shippingFee)} delivery)
                    </span>
                  )}
                </div>
                <Button
                  loading={submitting}
                  onClick={() => void handleCheckout()}
                  style={blueButtonStyle}
                  className="h-[38px] min-w-[160px] rounded-sm px-6 text-[14px] font-medium"
                >
                  CHECKOUT
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
