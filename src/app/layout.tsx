import type { Metadata } from 'next';
import './globals.css';
import AntdRegistryWrapper from '@/components/layout/AntdRegistryWrapper';
import StoreProvider from '@/store/StoreProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'PageTurner Bookstore | Discover, Read & Order Books',
  description:
    'Discover your next favourite read at PageTurner Bookstore, with new favourites and timeless classics to explore.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fafafa]">
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
