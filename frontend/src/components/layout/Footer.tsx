'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) return null;
  const isCompactReferencePage =
    pathname === '/orders' ||
    pathname === '/wishlist' ||
    pathname === '/cart';
  const isWishlistPage = pathname === '/wishlist';

  return (
    <footer className="bg-[var(--footer)] text-white">
      <div
        className={`mx-auto box-border w-full px-4 text-left lg:px-0 ${
          isWishlistPage
            ? 'flex h-[50px] max-w-[1018px] items-center text-[12px] leading-[15px]'
            : isCompactReferencePage
              ? 'max-w-[880px] py-2 text-[10px] leading-[18px] text-white/80'
              : 'max-w-[1014px] py-4 text-[12px] leading-[18px] text-white/80'
        }`}
      >
        Copyright © {new Date().getFullYear()}, Bookstore Private Limited. All Rights Reserved
      </div>
    </footer>
  );
}
