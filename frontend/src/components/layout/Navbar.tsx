'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Badge, Button, Dropdown, Input, MenuProps, Drawer, message } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  BookOutlined,
  ReadOutlined,
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
import { authService, clearSessionHint } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const { mode, preference, setPreference, toggleTheme } = useThemeMode();

  const isOrdersPage = pathname === '/orders';
  const isCartPage = pathname === '/cart';
  const isWishlistPage = pathname === '/wishlist';
  const isMainCatalogPage = pathname === '/' || pathname === '/books';
  const isReferenceNavbarPage = isWishlistPage || isMainCatalogPage;
  const isCompactReferencePage =
    isOrdersPage || isWishlistPage || isCartPage;
  const cartItems = useAppSelector((state) => state.cart.items);
  const { user, isAuthenticated, loading: authLoading } = useAppSelector((state) => state.auth);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const profileLabel = isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Profile';
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);

  if (isAuthRoute) return null;

  const handleSearchSubmit = (value: string) => {
    if (value.trim()) {
      router.push(`/books?search=${encodeURIComponent(value.trim())}`);
      setNavSearch('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      clearSessionHint();
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

  const profileMenuItems: MenuProps['items'] = [
    ...(userMenuItems || []),
    { type: 'divider' },
    {
      key: 'appearance',
      label: 'Appearance',
      children: themeMenu,
    },
  ];

  const guestProfileMenu = (
    <div className="w-[190px] bg-white py-2 text-[#333] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      <div className="px-4 pb-3 pt-1">
        <div className="text-[13px] font-semibold">Welcome</div>
        <div className="mt-1 text-[11px] leading-4 text-[#878787]">
          To access account and manage orders
        </div>
        <Button
          block
          onClick={() => router.push(`/login?next=${encodeURIComponent(pathname || '/')}`)}
          className="!mt-3 !h-[25px] !border !border-solid !border-[#a03037] !bg-white !text-[11px] !font-medium !text-[#a03037] hover:!bg-[#a03037] hover:!text-white"
        >
          LOGIN/SIGNUP
        </Button>
      </div>
      <div className="border-t border-[#ebebeb]" />
      <button
        type="button"
        onClick={() => router.push(`/login?next=${encodeURIComponent('/orders')}`)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-[12px] text-[#333] hover:bg-[#f5f5f5]"
      >
        <FileTextOutlined /> My Orders
      </button>
      <button
        type="button"
        onClick={() => router.push(`/login?next=${encodeURIComponent('/wishlist')}`)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-[12px] text-[#333] hover:bg-[#f5f5f5]"
      >
        <HeartOutlined /> Wishlist
      </button>
    </div>
  );

  const profileTriggerClass = `box-border flex flex-col items-center justify-center border-y-0 border-l border-r-0 border-solid ${
    isReferenceNavbarPage ? 'border-[#8f2b2f]' : 'border-white/25'
  } bg-transparent text-white hover:bg-white/10 ${
    isReferenceNavbarPage ? 'w-[92px]' : isCompactReferencePage ? 'w-[78px]' : 'w-[88px]'
  }`;

  const profileTrigger = isAuthenticated ? (
    <Link href="/account" className={profileTriggerClass}>
      <UserOutlined className="text-lg" />
      <span className={`mt-0.5 max-w-[80px] truncate ${isReferenceNavbarPage ? 'text-[10px]' : 'text-[11px]'}`}>
        {profileLabel}
      </span>
    </Link>
  ) : (
    <button type="button" className={profileTriggerClass} aria-label="Open profile menu">
      <UserOutlined className="text-lg" />
      <span className={`mt-0.5 max-w-[80px] truncate ${isReferenceNavbarPage ? 'text-[10px]' : 'text-[11px]'}`}>
        {profileLabel}
      </span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-[var(--header)] text-white shadow-sm">
      <div className={`mx-auto box-border flex w-full items-stretch ${
        isReferenceNavbarPage
          ? 'h-[60px] max-w-[1066px] px-4 lg:pl-[14px] lg:pr-0'
          : `px-4 lg:px-0 ${isCartPage ? 'h-[47px] max-w-[790px]' : isCompactReferencePage ? 'h-[52px] max-w-[900px]' : 'h-[60px] max-w-[1014px]'}`
      }`}>
        <Link
          href="/"
          className={`flex shrink-0 items-center text-white ${
            isReferenceNavbarPage
              ? 'box-border w-[170px] gap-2 pr-[42px]'
              : `gap-2 ${isCompactReferencePage ? 'gap-1.5 pr-8' : 'pr-4'}`
          }`}
          aria-label="Bookstore home"
        >
          {isCompactReferencePage || isMainCatalogPage ? (
            <ReadOutlined
              className={
                isWishlistPage ? 'text-[28px]' : isMainCatalogPage ? 'text-[26px]' : 'text-[22px]'
              }
            />
          ) : (
            <BookOutlined className="text-2xl" />
          )}
          <span
            className={
              isCompactReferencePage && !isWishlistPage
                ? 'text-[18px] font-normal tracking-tight'
                : 'text-[20px] font-normal tracking-tight'
            }
          >
            Bookstore
          </span>
        </Link>

        {!isAuthRoute && (
          <div className={`hidden min-w-0 flex-1 items-center md:flex ${isReferenceNavbarPage ? 'px-0' : isCompactReferencePage ? 'px-2' : 'px-8'}`}>
            <Input
              allowClear
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onPressEnter={() => handleSearchSubmit(navSearch)}
              placeholder="Search ..."
              prefix={
                <SearchOutlined
                  className={`cursor-pointer ${isReferenceNavbarPage ? 'text-[#9d9d9d]' : 'text-[#888]'}`}
                  onClick={() => handleSearchSubmit(navSearch)}
                />
              }
              className={`w-full rounded-sm border-0 ${
                isReferenceNavbarPage
                  ? 'reference-navbar-search h-[34px] max-w-[490px] bg-[#fcfcfc]'
                  : isCompactReferencePage
                    ? 'h-7 max-w-[420px]'
                    : 'h-8 max-w-[488px]'
              }`}
              style={
                isReferenceNavbarPage
                  ? { height: isMainCatalogPage ? 33 : 34, maxWidth: 490 }
                  : undefined
              }
            />
          </div>
        )}

        <div className="ml-auto flex items-stretch">
          {!isAuthRoute && (
            <>
              {!isCompactReferencePage && !isMainCatalogPage && <Button
                type="text"
                aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
                icon={
                  mode === 'dark' ? (
                    <SunOutlined className="text-lg text-white" />
                  ) : (
                    <MoonOutlined className="text-lg text-white" />
                  )
                }
                onClick={toggleTheme}
                className="hidden h-full w-[48px] items-center justify-center rounded-none border-y-0 border-l border-r-0 border-solid border-white/25 text-white hover:bg-white/10 md:flex"
              />}
              {isAuthenticated ? (
                <Dropdown menu={{ items: profileMenuItems, selectedKeys: [preference] }} placement="bottomRight" trigger={['click']}>
                  {profileTrigger}
                </Dropdown>
              ) : (
                <Dropdown popupRender={() => guestProfileMenu} placement="bottomRight" trigger={['click']}>
                  {profileTrigger}
                </Dropdown>
              )}
              <Link
                href="/cart"
                className={`box-border flex flex-col items-center justify-center border-y-0 border-l border-solid ${
                  isReferenceNavbarPage ? 'border-[#8f2b2f] border-r' : 'border-white/25 border-r-0'
                } text-white hover:bg-white/10 ${
                  isReferenceNavbarPage ? 'w-[94px]' : isCompactReferencePage ? 'w-[78px]' : 'w-[88px]'
                }`}
              >
                <Badge
                  count={totalCartCount}
                  size="small"
                  color="#fff"
                  overflowCount={99}
                  style={{ color: 'var(--header)' }}
                >
                  <ShoppingCartOutlined className="text-lg text-white" />
                </Badge>
                <span className={`mt-0.5 ${isReferenceNavbarPage ? 'text-[10px]' : 'text-[11px]'}`}>Cart</span>
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
          <Button
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
          >
            Switch to {mode === 'dark' ? 'light' : 'dark'} mode
          </Button>
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
      <style jsx global>{`
        .reference-navbar-search.ant-input-affix-wrapper {
          padding-left: 14px !important;
        }

        .reference-navbar-search .ant-input-prefix {
          margin-right: 6px !important;
        }

        .reference-navbar-search .ant-input,
        .reference-navbar-search .ant-input::placeholder {
          font-size: 12px !important;
        }
      `}</style>
    </header>
  );
}
