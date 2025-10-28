'use client';

import { useEffect, useState } from 'react';
import { getVersionInfo, formatVersionDisplay, type VersionInfo } from '@/lib/version';

interface VersionDisplayProps {
  /**
   * Position of the version display
   * @default 'bottom-right'
   */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  /**
   * Whether to show on hover only
   * @default false
   */
  showOnHover?: boolean;
}

export default function VersionDisplay({
  position = 'bottom-right',
  showOnHover = false
}: VersionDisplayProps) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    getVersionInfo().then(setVersionInfo);
  }, []);

  if (!versionInfo) return null;

  const positionClasses = {
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
  };

  const baseOpacity = showOnHover ? 'opacity-0 hover:opacity-30' : 'opacity-20';
  const hoverOpacity = isHovered ? 'opacity-50' : '';

  return (
    <div
      className={`
        fixed ${positionClasses[position]}
        text-[10px] text-slate-500 font-mono
        ${baseOpacity} ${hoverOpacity}
        transition-opacity duration-200
        pointer-events-auto
        select-none
        z-[9999]
        px-2 py-1 rounded
        hover:bg-slate-100/50
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Build: ${new Date(versionInfo.buildTime).toLocaleString()}\nBranch: ${versionInfo.gitBranch}`}
    >
      {formatVersionDisplay(versionInfo)}
    </div>
  );
}
