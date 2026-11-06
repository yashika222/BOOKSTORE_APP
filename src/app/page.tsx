'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spin } from 'antd';
import {
  BookOutlined,
  CompassOutlined,
  LockOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setGuestMode } from '@/store/authSlice';

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isGuest, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!loading && (isAuthenticated || isGuest)) {
      router.replace('/home');
    }
  }, [isAuthenticated, isGuest, loading, router]);

  if (loading || isAuthenticated || isGuest) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Spin size="large" tip="Preparing your bookstore..." />
      </div>
    );
  }

  const continueAsGuest = () => {
    sessionStorage.setItem('bookstore_guest_mode', 'true');
    dispatch(setGuestMode(true));
    router.push('/home');
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full items-center gap-12 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700">
            <BookOutlined />
            <span>Welcome to PageTurner</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            A good book can take you anywhere.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Find your next favourite read, explore timeless classics, and keep your books together in one welcoming place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button type="primary" size="large" icon={<LockOutlined />} className="bg-violet-700 font-semibold">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="large" icon={<UserAddOutlined />} className="font-semibold">
                Create an account
              </Button>
            </Link>
          </div>
          <Button
            type="link"
            size="large"
            icon={<CompassOutlined />}
            onClick={continueAsGuest}
            className="px-0 font-semibold text-violet-700"
          >
            Continue as Guest
          </Button>
          <p className="text-xs text-slate-500">
            Guest browsing is free. Sign in when you&apos;re ready to save a wishlist or place an order.
          </p>
        </div>

        <div className="relative hidden min-h-[360px] items-center justify-center rounded-2xl bg-violet-50 p-8 lg:flex">
          <div className="absolute left-12 top-12 h-52 w-36 -rotate-12 rounded-lg bg-indigo-900 shadow-xl" />
          <div className="absolute right-12 top-16 h-56 w-40 rotate-6 rounded-lg bg-amber-700 shadow-xl" />
          <div className="relative z-10 flex h-64 w-48 -rotate-2 items-center justify-center rounded-lg border border-white/30 bg-white p-5 text-center shadow-2xl">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-600">Turn the page</div>
              <div className="mt-4 text-3xl font-bold leading-tight text-slate-900">Your next story awaits</div>
              <div className="mt-4 text-sm text-slate-500">Discover something wonderful</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
