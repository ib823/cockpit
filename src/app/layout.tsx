import OverlaySafety from '@/components/OverlaySafety';
import VersionDisplay from '@/components/shared/VersionDisplay';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Keystone',
  description: 'From RFP to Proposal in 10 Minutes',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Suspense fallback={null}>
          <OverlaySafety />
        </Suspense>
        <Providers>
          {children}
        </Providers>
        <VersionDisplay position="bottom-left" showOnHover />
      </body>
    </html>
  );
}
