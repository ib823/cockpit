import React from 'react';
import clsx from 'clsx';

export interface ProgressProps {
  value?: number;
  label?: string;
  indeterminate?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  label,
  indeterminate,
  className
}) => {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx('w-full', className)}>
      {label && <div className="mb-1 text-[13px] text-[var(--ink)]/80">{label}</div>}
      <div className="h-2 rounded-full bg-[var(--canvas)] border border-[var(--line)] overflow-hidden">
        <div
          className={clsx(
            'h-full bg-[var(--accent)] transition-[width] duration-300',
            indeterminate && 'animate-[indet_1.2s_ease_infinite]'
          )}
          style={!indeterminate ? { width: `${pct}%` } : { width: '40%' }}
        />
      </div>
      <style jsx>{`
        @keyframes indet {
          0% {
            margin-left: -40%;
          }
          50% {
            margin-left: 40%;
          }
          100% {
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
};
