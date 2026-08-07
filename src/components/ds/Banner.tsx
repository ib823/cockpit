"use client";

/**
 * Design system — Banner (layer 3)
 *
 * Its own module rather than an export of Feedback.tsx: almost every screen
 * shows a banner, and very few need the Toast provider's context and portal
 * machinery or the four empty states. Bundling them together put all of it on
 * /login, which needs one error banner and nothing else.
 */

import { cx } from "./cx";
import React, { type ReactNode } from "react";
import styles from "./Feedback.module.css";

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
      className={cx(styles.banner, BANNER_TONE[tone], className)}
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
