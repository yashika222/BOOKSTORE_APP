'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Alert, Divider, message, Spin } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BookOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, setGuestMode } from '@/store/authSlice';
import api from '@/lib/axios';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local.',
  google_denied: 'Google sign-in was cancelled or could not be verified.',
  google_failed: 'Google sign-in failed. Please try again.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextPath = searchParams.get('next') || undefined;

  useEffect(() => {
    const googleError = searchParams.get('error');
    if (googleError && GOOGLE_ERRORS[googleError]) {
      setErrorMessage(GOOGLE_ERRORS[googleError]);
    }
  }, [searchParams]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/api/auth/login', {
        email: values.email,
        password: values.password,
      });

      if (res.data?.success && res.data?.user) {
        dispatch(setCredentials({ user: res.data.user }));
        message.success(`Welcome back, ${res.data.user.name}!`);

        const requestedPath = nextPath || new URLSearchParams(window.location.search).get('next');
        const safePath =
          requestedPath?.startsWith('/') &&
          !requestedPath.startsWith('//') &&
          requestedPath !== '/login' &&
          requestedPath !== '/register'
            ? requestedPath
            : null;
        router.push(safePath || (res.data.user.role === 'admin' ? '/admin' : '/home'));
      } else {
        throw new Error(res.data?.message || 'Login failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    form.setFieldsValue({
      email: 'admin@bookstore.com',
      password: 'Admin@123456',
    });
    setErrorMessage(null);
  };

  const fillCustomerCredentials = () => {
    form.setFieldsValue({
      email: 'reader@bookstore.com',
      password: 'Reader@123456',
    });
    setErrorMessage(null);
  };

  const continueAsGuest = () => {
    sessionStorage.setItem('bookstore_guest_mode', 'true');
    dispatch(setGuestMode(true));
    router.push('/home');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            <BookOutlined />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Sign In to PageTurner
          </h1>
          <p className="text-sm text-gray-500">Sign in to save books and manage your orders.</p>
        </div>

        {errorMessage && (
          <Alert
            message="Sign In Error"
            description={errorMessage}
            type="error"
            showIcon
            className="rounded-xl text-xs"
          />
        )}

        <Form
          form={form}
          name="loginForm"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-4"
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Enter a valid email address' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="you@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <div className="flex w-full justify-between items-center">
                <span>Password</span>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            }
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            className="bg-violet-600 hover:bg-violet-700 font-bold h-11 text-sm shadow-md mt-2"
          >
            Sign In
          </Button>
        </Form>

        <Divider plain className="my-2 text-xs text-gray-400">
          or
        </Divider>

        <GoogleSignInButton nextPath={nextPath} />

        {/* Demo Viva Fill Buttons */}
        <div className="pt-1">
          <div className="text-center text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
            Quick Demo / Viva Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="middle"
              onClick={fillAdminCredentials}
              className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-medium"
            >
              Fill Admin Account
            </Button>
            <Button
              size="middle"
              onClick={fillCustomerCredentials}
              className="text-xs bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 font-medium"
            >
              Fill Customer Account
            </Button>
          </div>
        </div>

        <Divider className="my-2" />

        <div className="text-center text-xs text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-violet-600 hover:underline">
            Register here
          </Link>
        </div>

        <Button type="link" icon={<CompassOutlined />} onClick={continueAsGuest} block>
          Continue as Guest
        </Button>

        <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
          <SafetyCertificateOutlined className="text-emerald-500" />
          <span>Secure HTTP-only JWT session authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <Spin size="large" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
