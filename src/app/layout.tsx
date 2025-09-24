import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAP Implementation Cockpit',
  description: 'Intelligent SAP implementation planning and management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
