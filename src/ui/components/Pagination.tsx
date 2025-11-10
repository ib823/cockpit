import React from "react";
import clsx from "clsx";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  size?: "sm" | "md";
  compact?: boolean;
  className?: string;
}

function pages(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const res: (number | "…")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(pageCount - 1, page + 1);
  if (left > 2) res.push("…");
  for (let p = left; p <= right; p++) res.push(p);
  if (right < pageCount - 1) res.push("…");
  res.push(pageCount);
  return res;
}

const sizes = {
  sm: "h-8 min-w-8 text-sm px-2",
  md: "h-9 min-w-9 text-sm px-3",
} as const;

const btnBase =
  "inline-flex items-center justify-center rounded-[10px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--canvas)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] transition";

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageCount,
  onPageChange,
  size = "md",
  compact = false,
  className,
}) => {
  const go = (p: number) => onPageChange(Math.min(pageCount, Math.max(1, p)));
  const disabledPrev = page <= 1;
  const disabledNext = page >= pageCount;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={clsx("flex items-center gap-2", className)}
    >
      <button
        className={clsx(btnBase, sizes[size], disabledPrev && "opacity-50 cursor-not-allowed")}
        onClick={() => go(1)}
        aria-label="First page"
        disabled={disabledPrev}
      >
        «
      </button>
      <button
        className={clsx(btnBase, sizes[size], disabledPrev && "opacity-50 cursor-not-allowed")}
        onClick={() => go(page - 1)}
        aria-label="Previous page"
        disabled={disabledPrev}
      >
        ‹
      </button>

      {!compact &&
        pages(page, pageCount).map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className={clsx("px-1 text-[var(--ink)]/50")}>
              …
            </span>
          ) : (
            <button
              key={p}
              className={clsx(
                btnBase,
                sizes[size],
                p === page && "bg-[var(--accent)] border-transparent text-white"
              )}
              aria-current={p === page ? "page" : undefined}
              onClick={() => go(p)}
            >
              {p}
            </button>
          )
        )}

      <button
        className={clsx(btnBase, sizes[size], disabledNext && "opacity-50 cursor-not-allowed")}
        onClick={() => go(page + 1)}
        aria-label="Next page"
        disabled={disabledNext}
      >
        ›
      </button>
      <button
        className={clsx(btnBase, sizes[size], disabledNext && "opacity-50 cursor-not-allowed")}
        onClick={() => go(pageCount)}
        aria-label="Last page"
        disabled={disabledNext}
      >
        »
      </button>
    </nav>
  );
};
