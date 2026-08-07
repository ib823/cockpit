"use client";

/**
 * Design system — AuthShell (layer 3, Composites)
 *
 * The centred card used by sign-in, registration and recovery.
 *
 * Deliberately a separate module from `AppShell`, not merely a separate
 * export. An unauthenticated screen has no project, no role, no sync state and
 * no navigation, so it needs none of that code — and importing it from
 * AppShell.tsx dragged in next/link, the nav state machine and the whole
 * Display module. On /login that was tens of kilobytes of route JS for a
 * two-field form.
 */

import { cx } from "./cx";
import React, { type ReactNode } from "react";
import styles from "./AppShell.module.css";

/* ==========================================================================
 * AuthShell
 * ========================================================================*/

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered under the card — version, support link. */
  footer?: ReactNode;
}

/**
 * The centred card used by sign-in, registration and recovery.
 *
 * Separate from `AppShell` because an unauthenticated screen has no project,
 * no role, no sync state and no navigation — putting it through the same
 * component would mean a shell whose every feature is conditional.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className={cx("ds", styles.authShell)} id="main-content">
      <div>
        <div className={styles.authCard}>
          <header className={styles.authHeader}>
            <h1 className={styles.authTitle}>{title}</h1>
            {subtitle && <p className={styles.authSubtitle}>{subtitle}</p>}
          </header>
          <div className={styles.authBody}>{children}</div>
        </div>
        {footer}
      </div>
    </main>
  );
}

export interface AuthStatusProps {
  /** The message. Announced politely — these are progress reports. */
  message: string;
  variant?: "busy" | "success";
}

/**
 * A busy or finished stage inside an AuthShell.
 *
 * The live region wraps the whole block rather than just the text, so the
 * transition from "Creating passkey" to "Success" is announced as one change
 * instead of two.
 */
export function AuthStatus({ message, variant = "busy" }: AuthStatusProps) {
  return (
    <div className={styles.authStatus} role="status" aria-live="polite">
      {variant === "busy" ? (
        <span className={styles.authSpinner} aria-hidden="true" />
      ) : (
        <span className={styles.authSuccessGlyph} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M5.5 11.5 9 15l7.5-8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <p className={styles.authStatusText}>{message}</p>
    </div>
  );
}

/** Full-width stacked actions inside an AuthShell. */
export function AuthActions({
  children,
  row,
}: {
  children: ReactNode;
  /** Lays the actions side by side, the first one flexing. */
  row?: boolean;
}) {
  return (
    <div className={cx(styles.authActions, row && styles.authActionsRow)}>{children}</div>
  );
}

/** Class hook for the 6-digit access-code field. */
export const codeInputClass = styles.codeInput;
