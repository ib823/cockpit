import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Timeline Collapsed View Options',
  description: 'Interactive mockups for presales estimation timeline collapsed views',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function TimelineCollapsedViewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
