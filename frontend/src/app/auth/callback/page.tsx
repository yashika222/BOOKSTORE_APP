'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spin } from 'antd';
import { authService, setSessionHint } from '@/lib/api';
import { getSafeInternalPath } from '@/lib/safePath';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, logout } from '@/store/authSlice';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;
    const nextPath = getSafeInternalPath(searchParams.get('next'), '/home');

    authService
      .me()
      .then((response) => {
        if (!active) return;
        if (response.success && response.user) {
          dispatch(
            setCredentials({
              user: response.user,
              sessionExpiresAt: response.sessionExpiresAt,
            })
          );
          setSessionHint(response.user);
          router.replace(nextPath);
          return;
        }
        dispatch(logout());
        router.replace('/login?error=google_failed');
      })
      .catch(() => {
        if (!active) return;
        dispatch(logout());
        router.replace('/login?error=google_failed');
      });

    return () => {
      active = false;
    };
  }, [dispatch, router, searchParams]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
