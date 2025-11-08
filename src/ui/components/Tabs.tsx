import React, { createContext, useCallback, useContext, useEffect, useId, useState, useRef } from 'react';
import clsx from 'clsx';

type TabItem = { value: string; label: React.ReactNode; disabled?: boolean; content?: React.ReactNode };

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'underline' | 'pill' | 'contained';
  className?: string;
}

const sizes = {
  sm: { btn: 'h-8 px-3 text-sm', bar: 'h-[2px]' },
  md: { btn: 'h-10 px-4 text-sm', bar: 'h-[2px]' },
  lg: { btn: 'h-12 px-5 text-base', bar: 'h-[3px]' },
} as const;

const TabsCtx = createContext<{ active: string; setActive: (v: string) => void } | null>(null);

export function useTabs() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('useTabs must be used within Tabs');
  return ctx;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  size = 'md',
  variant = 'underline',
  className,
}) => {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(
    defaultValue ?? items.find((i) => !i.disabled)?.value ?? items[0]?.value ?? ''
  );
  const active = isControlled ? (value as string) : inner;
  const setActive = useCallback(
    (v: string) => {
      if (!isControlled) setInner(v);
      onChange?.(v);
    },
    [isControlled, onChange]
  );

  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    if (variant !== 'underline') return;
    const btn = listRef.current?.querySelector<HTMLButtonElement>(`button[data-value="${CSS.escape(active)}"]`);
    const parent = listRef.current;
    if (btn && parent) {
      const pRect = parent.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      const left = bRect.left - pRect.left + parent.scrollLeft;
      setIndicator({ left, width: bRect.width });
    }
  }, [active, items, variant]);

  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]') ?? []
    ).filter((b) => !b.disabled);
    if (!buttons.length) return;
    const idx = buttons.findIndex((b) => b.dataset.value === active);
    const go = (n: number) => {
      const next = buttons[(n + buttons.length) % buttons.length];
      next?.focus();
      next?.click();
    };
    if (e.key === 'ArrowRight') {
      go(idx + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      go(idx - 1);
      e.preventDefault();
    } else if (e.key === 'Home') {
      go(0);
      e.preventDefault();
    } else if (e.key === 'End') {
      go(buttons.length - 1);
      e.preventDefault();
    }
  }

  const tone = {
    underline: (it: TabItem) =>
      clsx(
        sizes[size].btn,
        'rounded-[10px] text-[var(--ink)]/80 hover:text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]',
        active === it.value && 'text-[var(--ink)]'
      ),
    pill: (it: TabItem) =>
      clsx(
        sizes[size].btn,
        'rounded-full border border-[var(--line)] text-[var(--ink)]/80 hover:bg-[var(--canvas)]',
        active === it.value && 'bg-[var(--accent)] text-white border-transparent'
      ),
    contained: (it: TabItem) =>
      clsx(
        sizes[size].btn,
        'rounded-[12px] text-[var(--ink)]/80 hover:bg-[var(--canvas)]',
        active === it.value &&
          'bg-[var(--surface)] shadow-[var(--shadow-sm)] text-[var(--ink)] border border-[var(--line)]'
      ),
  };

  return (
    <TabsCtx.Provider value={{ active, setActive }}>
      <div className={clsx('w-full', className)}>
        <div
          ref={listRef}
          role="tablist"
          aria-orientation="horizontal"
          className={clsx(
            'relative flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--line)]',
            variant !== 'underline' && 'border-b-0'
          )}
          onKeyDown={onListKeyDown}
        >
          {items.map((it) => (
            <button
              key={it.value}
              role="tab"
              data-value={it.value}
              id={`${id}-tab-${it.value}`}
              aria-selected={active === it.value}
              aria-controls={`${id}-panel-${it.value}`}
              disabled={!!it.disabled}
              className={clsx(tone[variant](it), it.disabled && 'opacity-50 cursor-not-allowed')}
              onClick={() => !it.disabled && setActive(it.value)}
            >
              {it.label}
            </button>
          ))}
          {variant === 'underline' && (
            <span
              aria-hidden
              className={clsx(
                'absolute bottom-0 left-0',
                sizes[size].bar,
                'bg-[var(--accent)] rounded-full transition-all duration-200'
              )}
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
            />
          )}
        </div>

        {items.map((it) => (
          <div
            key={it.value}
            role="tabpanel"
            id={`${id}-panel-${it.value}`}
            aria-labelledby={`${id}-tab-${it.value}`}
            hidden={active !== it.value}
            className="pt-4"
          >
            {it.content}
          </div>
        ))}
      </div>
    </TabsCtx.Provider>
  );
};
