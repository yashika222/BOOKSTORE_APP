'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Input, Spin, message } from 'antd';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { authService, setSessionHint } from '@/lib/api';
import AuthCard, { AuthPageFrame } from '@/components/auth/AuthCard';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const nextPath = searchParams.get('next') || undefined;
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const finishAuthenticated = (
    user: { id: string; name: string; email: string; role: 'customer' | 'admin' },
    sessionExpiresAt?: string
  ) => {
    dispatch(setCredentials({ user, sessionExpiresAt }));
    setSessionHint(user);
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
      const res = await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        mobile: values.mobile,
      });
      if (res?.success && res?.requiresOtp) {
        setPendingEmail(res.email || values.email);
        message.success('Enter the 6-digit code sent to your email.');
        return;
      }
      if (res?.success && res?.user) {
        finishAuthenticated(res.user, res.sessionExpiresAt);
        return;
      }
      throw new Error(res?.message || 'Registration failed');
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
      const res = await authService.verifyOtp({ email: pendingEmail, otp });
      if (res?.success && res?.user) {
        finishAuthenticated(res.user, res.sessionExpiresAt);
        return;
      }
      throw new Error(res?.message || 'Verification failed');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <AuthPageFrame>
        <div className="mx-auto w-full max-w-md rounded bg-white p-8 shadow-lg">
          <div className="space-y-4">
            {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}
            <p className="text-sm text-[#0a0102]">
              If eligible, a 6-digit code was sent to <strong>{pendingEmail}</strong>. Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#a03037]">Sign in</Link>.
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
      </AuthPageFrame>
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
