// src/components/project/ResizablePanel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  side: 'left' | 'right';
  width: number;
  onResize: (width: number) => void;
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
}

export function ResizablePanel({
  side,
  width,
  onResize,
  children,
  minWidth = 240,
  maxWidth = 600
}: ResizablePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newWidth;

      if (side === 'left') {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, side, minWidth, maxWidth, onResize]);

  return (
    <div
      ref={panelRef}
      className="relative flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      {children}

      {/* Resize handle */}
      <div
        className={`absolute top-0 ${side === 'left' ? 'right-0' : 'left-0'} h-full w-1 cursor-col-resize hover:bg-blue-500 transition-colors group`}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 group-hover:bg-blue-500 transition-colors" />
      </div>
    </div>
  );
}
