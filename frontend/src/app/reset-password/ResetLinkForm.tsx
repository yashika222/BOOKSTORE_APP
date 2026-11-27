'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Form, Input, message } from 'antd';
import { LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { resetPasswordAction } from './actions';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { setCartItems } from '@/store/cartSlice';
import { setWishlistItems } from '@/store/wishlistSlice';
import { broadcastAuthTabEvent } from '@/lib/api/authEvents';
import { clearSessionHint } from '@/lib/api';

export default function ResetLinkForm({ token }: { token: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await resetPasswordAction({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }
      setComplete(true);
      form.resetFields();
      dispatch(setCartItems([]));
      dispatch(setWishlistItems([]));
      dispatch(logout());
      clearSessionHint();
      broadcastAuthTabEvent({ type: 'expired' });
      try {
        if (userId) {
          localStorage.removeItem(`bookstore_cart_v2_${userId}`);
          localStorage.removeItem(`bookstore_wishlist_v2_${userId}`);
        }
      } catch {
        // Password reset remains complete even if local storage is unavailable.
      }
      message.success('Your password has been changed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-page mx-auto max-w-md px-4 py-16">
      <div className="space-y-6 rounded-3xl border border-gray-200/80 bg-white p-8 shadow-md">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a03037] text-2xl text-white shadow-md">
            <SafetyCertificateOutlined />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {complete ? 'Password Updated' : 'Create a New Password'}
          </h1>
          <p className="text-sm text-gray-500">
            {complete
              ? 'Your password has changed. Sign in with your new password.'
              : 'Choose a strong password for your BookStore account.'}
          </p>
        </div>

        {errorMessage ? (
          <Alert type="error" showIcon message="Password reset" description={errorMessage} />
        ) : null}

        {complete ? (
          <Button
            type="primary"
            block
            className="h-11 bg-[#a03037] font-bold"
            onClick={() => router.push('/login')}
          >
            Go to Sign In
          </Button>
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { required: true, message: 'Enter your new password.' },
                { min: 8, max: 72, message: 'Password must be between 8 and 72 characters.' },
                { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: 'Include at least one letter and one number.' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="new-password"
                placeholder="New password"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Confirm your new password.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('The passwords do not match.'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="new-password"
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} className="h-11 bg-[#a03037] font-bold">
              Reset Password
            </Button>
          </Form>
        )}

        <div className="text-center">
          <Link href="/forgot-password" className="text-xs font-semibold text-gray-500">
            Request another reset link
          </Link>
        </div>
      </div>
    </div>
  );
}
