'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Badge, Button, Dropdown, Input, MenuProps, Drawer, message } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  BookOutlined,
  MenuOutlined,
  SearchOutlined,
  DashboardOutlined,
  LogoutOutlined,
  FileTextOutlined,
  HeartOutlined,
  MoonOutlined,
  SunOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useThemeMode } from '@/lib/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import api from '@/lib/axios';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const { mode, preference, setPreference } = useThemeMode();

  const cartItems = useAppSelector((state) => state.cart.items);
  const { user, isAuthenticated, loading: authLoading } = useAppSelector((state) => state.auth);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const profileLabel = isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Profile';
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);

  const handleSearchSubmit = (value: string) => {
    if (value.trim()) {
      router.push(`/books?search=${encodeURIComponent(value.trim())}`);
      setNavSearch('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      dispatch(logout());
      sessionStorage.removeItem('bookstore_guest_mode');
      message.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to log out. Please try again.');
    }
  };

  const userMenuItems: MenuProps['items'] = isAuthenticated
    ? [
        {
          key: 'account',
          icon: <UserOutlined />,
          label: <Link href="/account">My Profile</Link>,
        },
        {
          key: 'orders',
          icon: <FileTextOutlined />,
          label: <Link href="/orders">My Orders</Link>,
        },
        {
          key: 'wishlist',
          icon: <HeartOutlined />,
          label: <Link href="/wishlist">My Wishlist</Link>,
        },
        ...(user?.role === 'admin'
          ? [
              {
                key: 'admin',
                icon: <DashboardOutlined />,
                label: <Link href="/admin">Admin Dashboard</Link>,
              },
            ]
          : []),
        { type: 'divider' as const },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          danger: true,
          label: 'Log Out',
          onClick: handleLogout,
        },
      ]
    : [
        { key: 'login', label: <Link href="/login">Login</Link> },
        { key: 'register', label: <Link href="/register">Sign up</Link> },
      ];

  const themeMenu: MenuProps['items'] = [
    {
      key: 'system',
      icon: <DesktopOutlined />,
      label: 'System',
      onClick: () => setPreference('system'),
    },
    {
      key: 'light',
      icon: <SunOutlined />,
      label: 'Light',
      onClick: () => setPreference('light'),
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: 'Dark',
      onClick: () => setPreference('dark'),
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--header)] text-white shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-[1366px] items-stretch px-3 sm:px-10">
        <Link href="/" className="flex items-center gap-2 pr-4 text-white" aria-label="Bookstore home">
          <BookOutlined className="text-2xl" />
          <span className="text-[22px] font-semibold tracking-tight">Bookstore</span>
        </Link>

        {!isAuthRoute && (
          <div className="hidden flex-1 items-center px-6 md:flex">
            <Input
              allowClear
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onPressEnter={() => handleSearchSubmit(navSearch)}
              placeholder="Search ..."
              suffix={
                <SearchOutlined
                  className="cursor-pointer text-[#888]"
                  onClick={() => handleSearchSubmit(navSearch)}
                />
              }
              className="h-10 max-w-[560px] rounded-sm border-0"
            />
          </div>
        )}

        <div className="ml-auto flex items-stretch">
          <Dropdown menu={{ items: themeMenu, selectedKeys: [preference] }} placement="bottomRight">
            <button
              type="button"
              aria-label={`Theme: ${preference}. Current appearance ${mode}`}
              className="hidden w-12 items-center justify-center text-white/90 hover:bg-white/10 sm:flex"
            >
              {mode === 'dark' ? <MoonOutlined /> : <SunOutlined />}
            </button>
          </Dropdown>

          {!isAuthRoute && (
            <>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Link
                  href={isAuthenticated ? '/account' : '/login'}
                  className="flex w-[88px] flex-col items-center justify-center border-l border-white/25 text-white hover:bg-white/10"
                >
                  <UserOutlined className="text-lg" />
                  <span className="mt-0.5 max-w-[80px] truncate text-[11px]">{profileLabel}</span>
                </Link>
              </Dropdown>
              <Link
                href="/cart"
                className="flex w-[88px] flex-col items-center justify-center border-l border-white/25 text-white hover:bg-white/10"
              >
                <Badge count={totalCartCount} size="small" color="#fff" overflowCount={99}>
                  <ShoppingCartOutlined className="text-lg text-white" />
                </Badge>
                <span className="mt-0.5 text-[11px]">Cart</span>
              </Link>
            </>
          )}

          <Button
            type="text"
            icon={<MenuOutlined className="text-lg text-white" />}
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center justify-center md:hidden"
          />
        </div>
      </div>

      <Drawer title="Bookstore" placement="right" onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen} width={300}>
        <div className="flex flex-col gap-3">
          <Input.Search
            placeholder="Search ..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            onSearch={handleSearchSubmit}
          />
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/books" onClick={() => setMobileMenuOpen(false)}>Books</Link>
          <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
          <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>Cart</Link>
          {isAuthenticated ? (
            <>
              <Link href="/account" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
              <Button danger onClick={handleLogout}>Log Out</Button>
            </>
          ) : !authLoading ? (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
            </>
          ) : null}
        </div>
      </Drawer>
    </header>
  );
}
