/* From Uiverse.io by ilkhoeri */
'use client';

import React, { ReactNode } from 'react';

interface CustomTooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  color?: string;
  bgColor?: string;
  size?: string;
  className?: string;
}

export function CustomTooltip({
  children,
  content,
  color = 'red',
  bgColor = '#fff',
  size = '1rem',
  className = '',
}: CustomTooltipProps) {
  return (
    <div
      className={`custom-tooltip ${className}`}
      style={
        {
          '--cl': color,
          '--bg': bgColor,
          '--sz': size,
        } as React.CSSProperties
      }
    >
      <div className="custom-tooltip-trigger">{children}</div>
      <div className="custom-tooltip-content">{content}</div>

      <style jsx>{`
        .custom-tooltip {
          --bg: #fff;
          --cl: red;
          --sz: 1rem;
          --sizer: 44px;
          --h-cnt: calc(var(--sz) * 2);
          position: relative;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .custom-tooltip-trigger {
          color: var(--cl);
          background: var(--bg);
          font-weight: 600;
          cursor: pointer;
          border-radius: 999px;
          padding: calc(var(--sz) / 2);
          font-size: var(--sz);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          outline: none;
          box-shadow:
            rgba(95, 95, 115, 0.25) 0px 2px 5px -1px,
            rgba(255, 255, 255, 0.3) 0px 1px 3px -1px;
        }

        .custom-tooltip-trigger:hover {
          --scale-1: 0.9;
          --scale-2: 0.8;
          animation: scaling 1s ease infinite;
        }

        @keyframes scaling {
          0% {
            transform: scale(1);
          }
          20%,
          90% {
            transform: scale(var(--scale-1));
          }
          50% {
            transform: scale(var(--scale-2));
          }
        }

        .custom-tooltip-content {
          position: absolute;
          border-radius: 999px;
          top: calc(var(--h-cnt) * -0.75);
          font-size: 14px;
          padding: calc(var(--sz) / 4) calc(var(--sz) / 2);
          z-index: 999;
          pointer-events: none;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: max-content;
          transition: all 0.3s ease;
          opacity: 0;
          transform: scale(0) translate(0, 200%);
          font-weight: 600;
          background-color: var(--cl);
          color: whitesmoke;
        }

        .custom-tooltip-content::before {
          position: absolute;
          content: '';
          height: 1rem;
          width: 1rem;
          bottom: -0.2em;
          left: 50%;
          transform: translate(-50%) rotate(45deg);
          border-radius: 2px;
          z-index: -2;
          background-color: var(--cl);
        }

        .custom-tooltip .custom-tooltip-trigger:hover + .custom-tooltip-content {
          top: calc(var(--h-cnt) * -1.25);
          visibility: visible;
          pointer-events: auto;
          opacity: 1;
          transform: scale(1) translate(0%, 0%);
        }
      `}</style>
    </div>
  );
}
