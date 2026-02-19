import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type Option = { value: string; label: string; disabled?: boolean };

export type SelectProps = {
  options: Option[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">;

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  size = "md",
  disabled,
  searchable = false,
  className,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label,
    [options, value]
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        listRef.current?.focus();
        if (activeIdx === -1 && value) {
          const idx = filtered.findIndex(o => o.value === value);
          if (idx !== -1) setActiveIdx(idx);
        }
      }, 0);
    }
  }, [open, value, filtered, activeIdx]);

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  } as const;

  function commit(val: string | null) {
    onChange?.(val);
    setOpen(false);
    buttonRef.current?.focus();
  }

  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const len = filtered.length;
    const next = (dir: 1 | -1) => {
      let i = activeIdx;
      if (!len) return;
      do {
        i = (i + dir + len) % len;
      } while (filtered[i]?.disabled);
      setActiveIdx(i);
    };
    if (e.key === "ArrowDown") {
      next(1);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      next(-1);
      e.preventDefault();
    } else if (e.key === "Enter") {
      const opt = filtered[activeIdx];
      if (opt && !opt.disabled) commit(opt.value);
    } else if (e.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className={clsx("relative inline-block", className)} {...rest}>
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          "w-full min-w-[200px] rounded-md border bg-primary text-left text-primary flex items-center justify-between gap-2",
          sizes[size],
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-secondary",
          "border-subtle focus-visible:ring-2 focus-visible:ring-blue transition-default"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={clsx("truncate", !selectedLabel && "text-secondary")}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={clsx("shrink-0 transition-default text-secondary", open && "rotate-180")}
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[1000] mt-1 w-full rounded-xl border border-strong bg-primary shadow-xl overflow-hidden animate-fade-in">
          {searchable && (
            <div className="p-2 border-b border-subtle">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full h-8 px-2 rounded-md border border-subtle bg-secondary text-primary focus:border-blue outline-none transition-default"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={id}
            role="listbox"
            tabIndex={0}
            aria-activedescendant={activeIdx >= 0 ? `${id}-opt-${activeIdx}` : undefined}
            onKeyDown={onListKey}
            className="max-h-64 overflow-auto py-1 focus:outline-none"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-secondary italic">No results</li>
            )}
            {filtered.map((opt, i) => {
              const selected = opt.value === value;
              const active = i === activeIdx;
              return (
                <li
                  key={opt.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => !opt.disabled && setActiveIdx(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => !opt.disabled && commit(opt.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (!opt.disabled) commit(opt.value);
                      e.preventDefault();
                    }
                  }}
                  tabIndex={-1}
                  className={clsx(
                    "px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-default",
                    opt.disabled && "opacity-40 cursor-not-allowed",
                    active ? "bg-blue-light text-blue" : "text-primary hover:bg-secondary"
                  )}
                >
                  <span className={clsx(selected && "font-semibold")}>
                    {opt.label}
                  </span>
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" className="text-blue">
                      <path
                        d="M20 6L9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
