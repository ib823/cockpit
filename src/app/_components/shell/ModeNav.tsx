/**
 * ModeNav Component
 * Segmented control for Capture / Decide / Plan / Present modes
 * Reflects active route, supports keyboard navigation
 */

'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Segmented, type SegmentedOption } from '../ui';

const MODE_OPTIONS: SegmentedOption[] = [
  { label: 'Capture', value: '/project/capture' },
  { label: 'Decide', value: '/project/decide' },
  { label: 'Plan', value: '/project/plan' },
  { label: 'Present', value: '/project/present' },
];

export const ModeNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active mode based on pathname
  const activeMode = MODE_OPTIONS.find((opt) => pathname.startsWith(opt.value))
    ?.value || '/project/capture';

  const handleModeChange = (value: string) => {
    router.push(value);
  };

  return (
    <Segmented
      options={MODE_OPTIONS}
      value={activeMode}
      onChange={handleModeChange}
      size="md"
    />
  );
};
