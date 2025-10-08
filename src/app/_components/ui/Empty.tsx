/**
 * Empty State Component - Clean empty state display
 */

import React from 'react';
import { clsx } from 'clsx';

export interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const Empty: React.FC<EmptyProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[var(--ink-muted)] opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--ink-dim)] max-w-md mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
