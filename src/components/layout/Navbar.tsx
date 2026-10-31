'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Badge,
  Button,
  Dropdown,
  Input,
  MenuProps,
  Drawer,
  Space,
  Avatar,
  message,
} from 'antd';
import {
  ShoppingCartOutlined,
  HeartOutlined,
  BookOutlined,
  UserOutlined,
  MenuOutlined,
  SearchOutlined,
  DashboardOutlined,
  LogoutOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import api from '@/lib/axios';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Calculate total cart items using reduce()
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

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
      message.success('Logged out successfully');
      router.push('/');
    } catch {
      dispatch(logout());
      message.info('Logged out');
      router.push('/');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="px-2 py-1">
          <div className="font-semibold text-gray-800">{user?.name}</div>
          <div className="text-xs text-gray-500">{user?.email}</div>
          {user?.role === 'admin' && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 font-bold rounded">
              Admin
            </span>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
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
            label: (
              <Link href="/admin" className="font-semibold text-purple-600">
                Admin Dashboard
              </Link>
            ),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Log Out',
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-gray-900 group">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
            <BookOutlined />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-gray-900">
              PageTurner
            </div>
            <div className="text-[10px] text-violet-600 font-semibold tracking-wider uppercase -mt-0.5">
              Bookstore & Library
            </div>
          </div>
        </Link>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <Input.Search
            placeholder="Search 10,000+ books by title or author..."
            allowClear
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            onSearch={handleSearchSubmit}
            enterButton={<SearchOutlined />}
            className="rounded-lg"
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-violet-600 ${
              pathname === '/' ? 'text-violet-600 font-semibold' : 'text-gray-600'
            }`}
          >
            Home
          </Link>
          <Link
            href="/books"
            className={`text-sm font-medium transition-colors hover:text-violet-600 ${
              pathname.startsWith('/books') ? 'text-violet-600 font-semibold' : 'text-gray-600'
            }`}
          >
            Catalog
          </Link>
          <Link
            href="/orders"
            className={`text-sm font-medium transition-colors hover:text-violet-600 ${
              pathname === '/orders' ? 'text-violet-600 font-semibold' : 'text-gray-600'
            }`}
          >
            Orders
          </Link>
          <Link
            href="/docs"
            className={`text-sm font-medium transition-colors hover:text-violet-600 ${
              pathname === '/docs' ? 'text-violet-600 font-semibold' : 'text-gray-600'
            }`}
          >
            API Docs
          </Link>
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border transition-colors ${
                pathname === '/admin'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Actions (Wishlist, Cart, User) */}
        <div className="flex items-center gap-3">
          {/* Wishlist Icon */}
          <Link href="/wishlist">
            <Button
              type="text"
              icon={
                <Badge count={wishlistItems.length} overflowCount={99} size="small">
                  <HeartOutlined className="text-xl text-gray-700 hover:text-red-500 transition-colors" />
                </Badge>
              }
              className="flex items-center justify-center p-2 rounded-lg"
            />
          </Link>

          {/* Cart Icon */}
          <Link href="/cart">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined className="text-lg" />}
              className="flex items-center gap-1.5 font-medium shadow-sm bg-violet-600 hover:bg-violet-700"
            >
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {totalCartCount}
              </span>
            </Button>
          </Link>

          {/* User Auth Menu */}
          {isAuthenticated && user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Button type="text" className="flex items-center gap-2 p-1 pl-2 rounded-full border border-gray-200">
                <Avatar size="small" className="bg-violet-600 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <span className="hidden sm:inline text-xs font-semibold text-gray-700 max-w-[100px] truncate">
                  {user.name}
                </span>
              </Button>
            </Dropdown>
          ) : (
            <Space className="hidden sm:flex">
              <Link href="/login">
                <Button type="text" className="text-sm font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="text-sm font-medium border-violet-600 text-violet-600 hover:bg-violet-50">
                  Register
                </Button>
              </Link>
            </Space>
          )}

          {/* Mobile Menu Hamburger */}
          <Button
            type="text"
            icon={<MenuOutlined className="text-lg" />}
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center"
          />
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <BookOutlined className="text-violet-600" />
            <span className="font-bold">PageTurner Bookstore</span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={300}
      >
        <div className="flex flex-col gap-4">
          <Input.Search
            placeholder="Search books..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            onSearch={handleSearchSubmit}
            className="mb-2"
          />

          <div className="flex flex-col gap-2 font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800"
            >
              Home
            </Link>
            <Link
              href="/books"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800"
            >
              Book Catalog (Infinite Scroll)
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 flex justify-between"
            >
              <span>Shopping Cart</span>
              <Badge count={totalCartCount} />
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 flex justify-between"
            >
              <span>Wishlist</span>
              <Badge count={wishlistItems.length} />
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800"
            >
              Order History
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800"
            >
              API Documentation
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-bold"
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 mt-2">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="text-sm">
                  Signed in as <b className="text-gray-900">{user.name}</b>
                </div>
                <Button danger block onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button type="primary" block className="bg-violet-600">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button block>Create Account</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </header>
  );
}
