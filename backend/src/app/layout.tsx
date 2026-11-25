import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FundooBooks API',
  description: 'Independent Next.js backend for FundooBooks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
