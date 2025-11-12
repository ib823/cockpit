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
    if (open) setTimeout(() => listRef.current?.focus(), 0);
  }, [open]);

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
          "w-full min-w-[200px] rounded-[var(--r-md)] border bg-[var(--surface)] text-left text-[var(--ink)] flex items-center justify-between gap-2",
          sizes[size],
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))]",
          "border-[var(--line)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={clsx("truncate", !selectedLabel && "text-[var(--gray-500)]")}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={clsx("shrink-0 transition", open && "rotate-180")}
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
        <div className="absolute z-[1000] mt-1 w-full rounded-[12px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden animate-[fadeUp_.18s_ease]">
          {searchable && (
            <div className="p-2 border-b border-[var(--line)]">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full h-8 px-2 rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
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
              <li className="px-3 py-2 text-sm text-[var(--gray-500)]">No results</li>
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
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => !opt.disabled && commit(opt.value)}
                  className={clsx(
                    "px-3 py-2 text-sm cursor-pointer flex items-center justify-between",
                    opt.disabled && "opacity-50 cursor-not-allowed",
                    active ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--accent-soft)]"
                  )}
                >
                  <span
                    className={clsx(
                      selected ? "font-medium text-[var(--ink)]" : "text-[var(--ink)]"
                    )}
                  >
                    {opt.label}
                  </span>
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
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
