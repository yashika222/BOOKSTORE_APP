import type { Metadata } from 'next';
import './globals.css';
import AntdRegistryWrapper from '@/components/layout/AntdRegistryWrapper';
import StoreProvider from '@/store/StoreProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'PageTurner Bookstore | Discover, Read & Order Books',
  description:
    'Full-stack Bookstore application built with React, Next.js App Router, TypeScript, Ant Design, Redux Toolkit, and Gutendex Infinite Scroll API.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fafaf9]">
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
