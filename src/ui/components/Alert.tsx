import React from 'react';
import clsx from 'clsx';

type Variant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: Variant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
}

const Circle: React.FC<{ i: 'i' | 's' | 'w' | 'e' }> = ({ i }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".15" />
    {i === 'i' && (
      <path d="M12 8h.01M11 11h2v6h-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    )}
    {i === 's' && (
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
    {i === 'w' && (
      <path d="M12 8v6m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    )}
    {i === 'e' && (
      <path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    )}
  </svg>
);

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, onClose }) => {
  const tone = {
    info: {
      bg: 'bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]',
      fg: 'text-[var(--ink)]',
      border: 'border-[var(--line)]',
      icon: <Circle i="i" />,
    },
    success: {
      bg: 'bg-[color-mix(in_srgb,var(--success)_10%,transparent)]',
      fg: 'text-[var(--ink)]',
      border: 'border-[var(--line)]',
      icon: <Circle i="s" />,
    },
    warning: {
      bg: 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]',
      fg: 'text-[var(--ink)]',
      border: 'border-[var(--line)]',
      icon: <Circle i="w" />,
    },
    error: {
      bg: 'bg-[color-mix(in_srgb,var(--error)_10%,transparent)]',
      fg: 'text-[var(--ink)]',
      border: 'border-[var(--line)]',
      icon: <Circle i="e" />,
    },
  }[variant];

  return (
    <div
      className={clsx(
        'w-full rounded-[var(--r-lg)] border px-4 py-3 flex items-start gap-3',
        tone.bg,
        tone.fg,
        tone.border
      )}
      role="alert"
    >
      <span aria-hidden>{tone.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {children && <div className="text-[14px] opacity-90">{children}</div>}
      </div>
      {onClose && (
        <button
          className="opacity-60 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] rounded-md"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
};
