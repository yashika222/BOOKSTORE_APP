'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Input, Spin, message } from 'antd';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import api from '@/lib/axios';
import AuthCard from '@/components/auth/AuthCard';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const nextPath = searchParams.get('next') || undefined;
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const finishAuthenticated = (user: { id: string; name: string; email: string; role: 'customer' | 'admin' }) => {
    dispatch(setCredentials({ user }));
    message.success('Account created successfully.');
    const safePath =
      nextPath?.startsWith('/') &&
      !nextPath.startsWith('//') &&
      nextPath !== '/login' &&
      nextPath !== '/register'
        ? nextPath
        : '/';
    router.push(safePath);
  };

  const onRegister = async (values: { name: string; email: string; password: string; mobile?: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
        mobile: values.mobile,
      });
      if (res.data?.success && res.data?.requiresOtp) {
        setPendingEmail(res.data.email);
        message.success('Enter the 6-digit code sent to your email.');
        return;
      }
      if (res.data?.success && res.data?.user) {
        finishAuthenticated(res.data.user);
        return;
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!pendingEmail) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/auth/verify-otp', { email: pendingEmail, otp });
      if (res.data?.success && res.data?.user) {
        finishAuthenticated(res.data.user);
        return;
      }
      throw new Error(res.data?.message || 'Verification failed');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="space-y-4 bg-[var(--card)] p-8 shadow-sm">
          {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}
          <p className="text-sm">
            We sent a 6-digit code to <strong>{pendingEmail}</strong>.
          </p>
          <Input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
          />
          <Button type="primary" block loading={loading} onClick={() => void verifyOtp()} className="bg-[#a03037]">
            Verify email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthCard
      mode="signup"
      nextPath={nextPath}
      loading={loading}
      errorMessage={errorMessage}
      onRegister={onRegister}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spin />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
