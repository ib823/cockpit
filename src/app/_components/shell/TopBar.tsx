/**
 * TopBar Component
 * Apple-like top navigation with brand, mode nav, and actions
 */

'use client';

import React from 'react';
import { ModeNav } from './ModeNav';
import { ClientSafeToggle } from './ClientSafeToggle';
import { Button, Tooltip } from '../ui';
import { Download, Share2 } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] bg-[var(--surface)] border-b border-[var(--line)]">
      <div className="content-max-w px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-[var(--ink)]">
              Keystone
            </div>
          </div>

          {/* Mode Navigation */}
          <div className="flex-1 flex justify-center">
            <ModeNav />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ClientSafeToggle />
            <div className="w-px h-6 bg-[var(--line)]" />
            <Tooltip title="Export project">
              <Button variant="ghost" size="sm" aria-label="Export">
                <Download size={16} />
              </Button>
            </Tooltip>
            <Tooltip title="Share project">
              <Button variant="ghost" size="sm" aria-label="Share">
                <Share2 size={16} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
};
