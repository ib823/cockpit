import React, { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export type ToastKind = "info" | "success" | "warning" | "error";
export type Toast = {
  id: string;
  kind: ToastKind;
  title?: string;
  desc?: string;
  duration?: number;
};

interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
  toasts: Toast[];
}

const Ctx = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push: (t: Omit<Toast, "id">) => string = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((arr) => [...arr, { id, duration: 3500, ...t }]);
    return id;
  };

  const remove = (id: string) => setToasts((arr) => arr.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={{ push, remove, toasts }}>
      {children}
      <ToastViewport />
    </Ctx.Provider>
  );
};

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const tone = {
  info: { bar: "bg-[var(--accent)]", title: "text-[var(--ink)]" },
  success: { bar: "bg-[var(--success)]", title: "text-[var(--ink)]" },
  warning: { bar: "bg-[var(--warning)]", title: "text-[var(--ink)]" },
  error: { bar: "bg-[var(--error)]", title: "text-[var(--ink)]" },
} as const;

const ToastViewport: React.FC = () => {
  const ctx = useContext(Ctx);
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client to prevent SSR hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // IMPORTANT: Call all hooks BEFORE any early returns (Rules of Hooks)
  const toasts = ctx?.toasts ?? [];
  const remove = ctx?.remove ?? (() => {});

  useEffect(() => {
    if (!ctx || !isMounted) return;
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), t.duration ?? 3500));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts, isMounted]);

  // Early return AFTER all hooks
  if (!ctx || !isMounted) return null;

  const node = (
    <div className="fixed bottom-4 right-4 z-[1060] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="w-[min(360px,90vw)] rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden animate-[fadeUp_.18s_ease]"
        >
          <div className={clsx("h-1 w-full", tone[t.kind].bar)} />
          <div className="p-3">
            {t.title && <div className={clsx("font-medium", tone[t.kind].title)}>{t.title}</div>}
            {t.desc && <div className="text-[13px] text-[var(--ink)]/80 mt-0.5">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  return createPortal(node, document.body);
};
