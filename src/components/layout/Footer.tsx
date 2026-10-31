import React from 'react';
import Link from 'next/link';
import { BookOutlined, GithubOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                <BookOutlined />
              </div>
              <span className="font-bold text-lg tracking-tight">PageTurner</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Modern full-stack bookstore built with React, Next.js App Router, TypeScript, Ant Design, Redux Toolkit, and MongoDB.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <ThunderboltOutlined className="text-amber-400" />
              <span>Project Gutenberg API (Gutendex) Integrated</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Explore Store
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home Page
                </Link>
              </li>
              <li>
                <Link href="/books" className="hover:text-white transition-colors">
                  Infinite Catalog
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Order History
                </Link>
              </li>
            </ul>
          </div>

          {/* DSA & Architecture Highlights */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              DSA Concepts Used
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-400">
              <li className="flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-400" />
                <span><b>reduce():</b> Cart subtotal & item totals</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-400" />
                <span><b>filter() & map():</b> Catalog & search grid</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-400" />
                <span><b>Set:</b> Duplicate book & wishlist check</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-400" />
                <span><b>Stack:</b> Cart item Undo feature (LIFO)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-400" />
                <span><b>Queue:</b> Order fulfillment stream (FIFO)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-400" />
                <span><b>Hash Index:</b> O(1) ISBN & ID book lookup</span>
              </li>
            </ul>
          </div>

          {/* Developer / Viva Info */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Developer Documentation
            </h3>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Swagger / OpenAPI Specs</span>
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <span className="text-xs text-stone-500">
                  Ready for Vercel deployment with MongoDB Atlas connection.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} PageTurner Bookstore. Built for evaluation & academic viva.
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 rounded bg-stone-800 text-stone-300 font-mono text-[11px]">
              Next.js 14 App Router
            </span>
            <span className="px-2 py-1 rounded bg-stone-800 text-stone-300 font-mono text-[11px]">
              Ant Design v5
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
