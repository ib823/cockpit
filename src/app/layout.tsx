import OverlaySafety from '@/components/OverlaySafety';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SAP Cockpit - Smart Implementation Planning',
  description: 'From RFP to Proposal in 10 Minutes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <OverlaySafety />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
