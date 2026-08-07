"use client";

/**
 * Design system — feedback composites (layer 3)
 *
 * EmptyState, Banner and the Toast system.
 *
 * The spec's four empty states are four different designs, not one component
 * with a colour prop, because they say four different things:
 *
 *   first-run     nothing is wrong — teach the first step, never apologise
 *   no-results    name the filters and quantify the fix
 *   error         say what happened, what it means for their data, two ways out
 *   no-permission deliberate, not broken — name the level held and required
 *
 * That distinction is enforced by the type: `kind` decides which fields are
 * required, so an error state without a recovery action will not compile.
 */

import { cn } from "@/lib/utils";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Feedback.module.css";

/* ==========================================================================
 * EmptyState
 * ========================================================================*/

type EmptyKind = "first-run" | "no-results" | "error" | "no-permission";

interface EmptyStateBase {
  title: string;
  /** The explanation. Concrete — name the filters, name the level, name the failure. */
  body: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

interface ErrorEmptyState extends EmptyStateBase {
  kind: "error";
  /**
   * Support reference, e.g. "PRJ-2291 / 14:32". Required for errors: without
   * it a support conversation starts with "which one?".
   */
  reference: string;
}

interface OtherEmptyState extends EmptyStateBase {
  kind: Exclude<EmptyKind, "error">;
  reference?: never;
}

export type EmptyStateProps = ErrorEmptyState | OtherEmptyState;

const EMPTY_TONE: Record<EmptyKind, string> = {
  "first-run": styles.toneFirstRun,
  "no-results": styles.toneNeutral,
  error: styles.toneError,
  "no-permission": styles.toneLocked,
};

const EMPTY_GLYPH: Record<EmptyKind, ReactNode> = {
  "first-run": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 7.5h13M6.5 7.5v7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  "no-results": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5.5 5.5l7 7M12.5 5.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  "no-permission": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="4" y="8" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 8V6a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
};

export function EmptyState(props: EmptyStateProps) {
  const { kind, title, body, primaryAction, secondaryAction, className } = props;
  // Error and no-permission are left-aligned: they are paragraphs of
  // explanation, and centred prose is measurably harder to read.
  const centered = kind === "first-run" || kind === "no-results";

  return (
    <div
      className={cn(
        styles.empty,
        centered ? styles.emptyCentered : styles.emptyLeft,
        className
      )}
      // Errors are assertive because the user is blocked; the others describe
      // a state they can already see.
      role={kind === "error" ? "alert" : "status"}
    >
      <span className={cn(styles.emptyGlyph, EMPTY_TONE[kind])}>{EMPTY_GLYPH[kind]}</span>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyBody}>{body}</p>
      {(primaryAction || secondaryAction) && (
        <div className={styles.emptyActions}>
          {primaryAction}
          {secondaryAction}
        </div>
      )}
      {props.kind === "error" && (
        <span className={styles.emptyReference}>{props.reference}</span>
      )}
    </div>
  );
}

/* ==========================================================================
 * Banner
 * ========================================================================*/

export type BannerTone = "info" | "success" | "warning" | "danger";

export interface BannerProps {
  tone: BannerTone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const BANNER_TONE: Record<BannerTone, string> = {
  info: styles.bannerInfo,
  success: styles.bannerSuccess,
  warning: styles.bannerWarning,
  danger: styles.bannerDanger,
};

const BANNER_GLYPH: Record<BannerTone, ReactNode> = {
  info: (
    <svg className={styles.bannerGlyph} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
    </svg>
  ),
  success: (
    <svg className={styles.bannerGlyph} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5.2 8.3 7 10.1l3.8-4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg className={styles.bannerGlyph} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.8 15 14H1L8 1.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 6.4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.4" r="0.85" fill="currentColor" />
    </svg>
  ),
  danger: (
    <svg className={styles.bannerGlyph} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * An inline, persistent message tied to the region it sits in.
 *
 * Not a toast: a banner stays until the condition clears, so it is right for
 * "you are viewing a baseline" and wrong for "saved".
 */
export function Banner({
  tone,
  title,
  children,
  actions,
  onDismiss,
  className,
}: BannerProps) {
  return (
    <div
      className={cn(styles.banner, BANNER_TONE[tone], className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      {BANNER_GLYPH[tone]}
      <div className={styles.bannerContent}>
        <p className={styles.bannerTitle}>{title}</p>
        {children && <div className={styles.bannerBody}>{children}</div>}
        {actions && <div className={styles.bannerActions}>{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className={styles.bannerDismiss}
          onClick={onDismiss}
          aria-label={`Dismiss: ${title}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
 * Toast
 * ========================================================================*/

export interface ToastOptions {
  tone?: BannerTone;
  /** Milliseconds before auto-dismiss. Errors default to staying put. */
  duration?: number;
  action?: ReactNode;
}

interface ToastRecord extends ToastOptions {
  id: number;
  message: string;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Toasts are capped at three; a fourth pushes the oldest out. */
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, ...options }].slice(-MAX_VISIBLE));
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          // One live region that persists across toasts. Creating a region at
          // the moment a message arrives is the classic reason announcements
          // are silently dropped — the region has to exist first.
          //
          // Polite, not assertive: a toast reports something that already
          // happened, and interrupting a screen-reader user mid-sentence to
          // say "saved" is worse than waiting.
          <div
            className={styles.toastRegion}
            role="status"
            aria-live="polite"
            aria-atomic="false"
          >
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const { id, tone = "info", duration } = toast;

  // An error that vanishes on a timer is an error the user may never have
  // read, so danger stays until dismissed unless a duration is given.
  const effectiveDuration = duration ?? (tone === "danger" ? 0 : 5000);

  useEffect(() => {
    if (effectiveDuration <= 0) return;
    const timer = setTimeout(() => onDismiss(id), effectiveDuration);
    return () => clearTimeout(timer);
  }, [effectiveDuration, id, onDismiss]);

  const toneClass =
    tone === "success"
      ? styles.toastSuccess
      : tone === "warning"
        ? styles.toastWarning
        : tone === "danger"
          ? styles.toastDanger
          : styles.toastInfo;

  return (
    <div className={cn(styles.toast, toneClass)}>
      <div className={styles.toastContent}>{toast.message}</div>
      {toast.action && <div className={styles.toastAction}>{toast.action}</div>}
      <button
        type="button"
        className={styles.bannerDismiss}
        onClick={() => onDismiss(id)}
        aria-label={`Dismiss: ${toast.message}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error("useToast must be used inside a <ToastProvider>.");
  }
  return api;
}
