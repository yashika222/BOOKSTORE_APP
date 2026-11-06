'use client';

import { useCallback } from 'react';
import { App } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

export function useAuthPrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const { message } = App.useApp();
  const { isAuthenticated, isGuest, loading } = useAppSelector((state) => state.auth);

  const requireAuthentication = useCallback(
    (copy = 'Please log in to continue.') => {
      if (!loading && isAuthenticated && !isGuest) return true;
      message.warning(copy);
      const next = encodeURIComponent(pathname || '/home');
      router.push(`/login?next=${next}`);
      return false;
    },
    [isAuthenticated, isGuest, loading, message, pathname, router]
  );

  return {
    requireAuthentication,
    prompt: null,
  };
}
