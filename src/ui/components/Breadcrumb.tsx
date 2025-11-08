import React from 'react';
import clsx from 'clsx';

export type Crumb = { label: React.ReactNode; href?: string; onClick?: () => void };

export interface BreadcrumbProps {
  items: Crumb[];
  'aria-label'?: string;
  className?: string;
  collapseAt?: number; // e.g. 5 → collapse middle when ≥ 5 items
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  collapseAt = 5,
  'aria-label': ariaLabel = 'Breadcrumb',
}) => {
  const needsCollapse = items.length >= collapseAt;
  const visible = needsCollapse ? [items[0], { label: '…' }, ...items.slice(-2)] : items;

  const Item = (c: Crumb, i: number) => {
    const isButton = !!c.onClick && !c.href;
    const common = 'text-sm';
    if (c.href)
      return (
        <a className={clsx(common, 'text-[var(--ink)]/70 hover:text-[var(--ink)]')} href={c.href}>
          {c.label}
        </a>
      );
    if (isButton)
      return (
        <button className={clsx(common, 'text-[var(--ink)]/70 hover:text-[var(--ink)]')} onClick={c.onClick}>
          {c.label}
        </button>
      );
    return <span className={clsx(common, 'text-[var(--ink)]/50')}>{c.label}</span>;
  };

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="flex flex-wrap items-center gap-2">
        {(visible.length ? visible : items).map((c, i, arr) => (
          <li key={i} className="flex items-center gap-2">
            {Item(c, i)}
            {i < arr.length - 1 && <span aria-hidden className="text-[var(--ink)]/40">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};
