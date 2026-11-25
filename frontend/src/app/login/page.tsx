'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spin, message } from 'antd';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { authService, setSessionHint } from '@/lib/api';
import AuthCard from '@/components/auth/AuthCard';

const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured:
    'Google sign-in is not configured on the server. Please contact the administrator.',
  google_denied: 'Google sign-in was cancelled or could not be verified.',
  google_failed: 'Google sign-in failed. Please try again.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const onLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.login({
        email: values.email,
        password: values.password,
      });
      if (res?.success && res?.user) {
        dispatch(setCredentials({ user: res.user }));
        setSessionHint(res.user);
        message.success(`Welcome back, ${res.user.name}!`);
        const requestedPath = nextPath;
        const safePath =
          requestedPath?.startsWith('/') &&
          !requestedPath.startsWith('//') &&
          requestedPath !== '/login' &&
          requestedPath !== '/register'
            ? requestedPath
            : null;
        router.push(safePath || (res.user.role === 'admin' ? '/admin' : '/'));
      } else {
        throw new Error(res?.message || 'Login failed');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      mode="login"
      nextPath={nextPath}
      loading={loading}
      errorMessage={errorMessage}
      onLogin={onLogin}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spin size="large" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
