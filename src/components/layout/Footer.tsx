import Link from 'next/link';
import { BookOutlined } from '@ant-design/icons';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                <BookOutlined />
              </div>
              <span className="font-bold text-lg tracking-tight">PageTurner</span>
            </div>
            <p className="text-sm leading-relaxed text-stone-400">
              Discover your next favourite read, from contemporary titles to timeless classics.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Explore Store
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/home" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/books" className="hover:text-white transition-colors">
                  Browse Books
                </Link>
              </li>
              <li>
                <Link href="/books?tab=commercial" className="hover:text-white transition-colors">
                  Shop Books
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">More information</h3>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Developer API documentation</span>
                </Link>
              </li>
              <li>
                <span className="text-xs text-stone-500">
                  Orders and wishlists are available after signing in.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-10 pt-6 text-center text-xs text-stone-500">
          <div>
            &copy; {new Date().getFullYear()} PageTurner Bookstore. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
