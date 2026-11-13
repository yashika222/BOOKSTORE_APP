import type { Metadata } from 'next';
import './globals.css';
import AntdRegistryWrapper from '@/components/layout/AntdRegistryWrapper';
import StoreProvider from '@/store/StoreProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/themeScript';

export const metadata: Metadata = {
  title: 'Bookstore | Discover, Read & Order Books',
  description:
    'Browse public-domain and storefront titles, manage your cart, and place cash-on-delivery orders.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AntdRegistryWrapper>
          <StoreProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </StoreProvider>
        </AntdRegistryWrapper>
      </body>
    </html>
  );
}
