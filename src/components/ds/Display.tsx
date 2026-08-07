"use client";

/**
 * Design system — display primitives (layer 2)
 *
 * StatusPill, Badge, Chip, Avatar, Progress, Skeleton.
 *
 * The through-line is principle P4: colour is the second channel, never the
 * only one. A status pill carries a glyph and a word; a progress bar prints
 * its figure; an over-allocated bar adds a hatch. Each of those survives a
 * projector, a monochrome printout, and any colour-vision deficiency.
 */

import { cx } from "./cx";
import React, { type ReactNode } from "react";
import styles from "./Display.module.css";

/* ==========================================================================
 * StatusPill
 * ========================================================================*/

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_GLYPH: Record<StatusTone, ReactNode> = {
  success: (
    <svg className={styles.pillGlyph} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M2 5.2 4 7.2l4-4.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg className={styles.pillGlyph} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M5 1.2 9.2 8.6H0.8L5 1.2Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M5 4.2v1.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="5" cy="7.1" r="0.6" fill="currentColor" />
    </svg>
  ),
  danger: (
    <svg className={styles.pillGlyph} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M2.6 2.6l4.8 4.8M7.4 2.6l-4.8 4.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg className={styles.pillGlyph} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5 4.4v2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="5" cy="2.9" r="0.65" fill="currentColor" />
    </svg>
  ),
  neutral: (
    <svg className={styles.pillGlyph} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="2.6" fill="currentColor" />
    </svg>
  ),
};

export interface StatusPillProps {
  tone: StatusTone;
  /** The word. Required — a glyph and a colour are not a label. */
  children: ReactNode;
  className?: string;
}

export function StatusPill({ tone, children, className }: StatusPillProps) {
  return (
    <span className={cx(styles.pill, styles[tone], className)}>
      {TONE_GLYPH[tone]}
      {children}
    </span>
  );
}

/* ==========================================================================
 * Badge — a count
 * ========================================================================*/

export interface BadgeProps {
  count: number;
  /** Values above this render as "N+". */
  max?: number;
  tone?: "accent" | "neutral" | "danger";
  /**
   * What the number counts. Becomes the accessible name, because "3" alone
   * tells a screen-reader user nothing.
   */
  label: string;
  className?: string;
}

export function Badge({ count, max = 99, tone = "accent", label, className }: BadgeProps) {
  const display = count > max ? `${max}+` : String(count);
  return (
    <span
      className={cx(
        styles.badge,
        tone === "neutral" && styles.badgeNeutral,
        tone === "danger" && styles.badgeDanger,
        className
      )}
      aria-label={`${count} ${label}`}
    >
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

/* ==========================================================================
 * Chip — a removable filter token
 * ========================================================================*/

export interface ChipProps {
  children: ReactNode;
  /** Omit for a static chip with no remove affordance. */
  onRemove?: () => void;
  /** Names what removal does, e.g. "EMEA". Required when removable. */
  removeLabel?: string;
  className?: string;
}

export function Chip({ children, onRemove, removeLabel, className }: ChipProps) {
  return (
    <span className={cx(styles.chip, !onRemove && styles.chipStatic, className)}>
      {children}
      {onRemove && (
        <button
          type="button"
          className={styles.chipRemove}
          onClick={onRemove}
          aria-label={`Remove ${removeLabel ?? ""}`.trim()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path
              d="M2.5 2.5l5 5M7.5 2.5l-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

/* ==========================================================================
 * Avatar
 * ========================================================================*/

export interface AvatarProps {
  /** Full name. Used for initials and for the accessible name. */
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** First and last initial — "Ada Lovelace" gives AL, "Ada" gives A. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const sizeClass =
    size === "sm" ? styles.avatarSm : size === "lg" ? styles.avatarLg : styles.avatarMd;

  return (
    <span
      className={cx(styles.avatar, sizeClass, className)}
      role="img"
      aria-label={name}
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={styles.avatarImage} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

/* ==========================================================================
 * Progress
 * ========================================================================*/

export interface ProgressProps {
  /** Percentage. May exceed 100 — over-allocation is a real state. */
  value: number;
  /** What is progressing. Becomes the accessible name. */
  label: string;
  tone?: "accent" | "success" | "warning" | "danger";
  /** Hides the printed figure. Only for a bar already beside its number. */
  hideValue?: boolean;
  className?: string;
}

export function Progress({
  value,
  label,
  tone = "accent",
  hideValue,
  className,
}: ProgressProps) {
  const over = value > 100;
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={cx(styles.progressWrap, className)}>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        // The max stays 100 even when the value exceeds it, so assistive
        // technology reports "120%" rather than silently rescaling.
        aria-valuemax={100}
        aria-valuetext={`${Math.round(value)}%`}
      >
        <div
          className={cx(
            styles.progressFill,
            tone === "success" && styles.progressFillSuccess,
            tone === "warning" && styles.progressFillWarning,
            (tone === "danger" || over) && styles.progressFillDanger,
            over && styles.progressOver
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      {!hideValue && (
        <span className={styles.progressValue} aria-hidden="true">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

/* ==========================================================================
 * Skeleton
 * ========================================================================*/

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "block" | "text" | "circle";
  className?: string;
}

/**
 * A loading placeholder.
 *
 * `aria-hidden` on purpose: the surrounding region carries `aria-busy`, and
 * announcing a dozen empty boxes tells a screen-reader user nothing useful.
 */
export function Skeleton({ width, height, variant = "block", className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        styles.skeleton,
        variant === "text" && styles.skeletonText,
        variant === "circle" && styles.skeletonCircle,
        className
      )}
      style={{ width, height }}
    />
  );
}
