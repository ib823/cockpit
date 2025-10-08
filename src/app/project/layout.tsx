/**
 * Project Layout
 * Top-level shell for the 4-mode experience
 * Capture → Decide → Plan → Present
 */

import React from 'react';
import { TopBar } from '../_components/shell/TopBar';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
      <TopBar />
      <main className="flex-1 content-max-w px-6 py-8">{children}</main>
    </div>
  );
}
