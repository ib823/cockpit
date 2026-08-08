"use client";

/**
 * Design system — AppShell (layer 3, Composites)
 *
 * Top bar, primary nav, contextual sub-nav, page header and card.
 *
 * The shell encodes three of the spec's rules, because they are decisions
 * about meaning rather than layout:
 *
 *  - **Primary nav is destinations; sub-nav is views of the current
 *    destination.** If an item changes what data you see rather than where you
 *    are, it is a filter, not navigation.
 *
 *  - **Role and cost-visibility are always on screen** (principle P3, "nothing
 *    important is implied"). Permission changes what every control below it
 *    does, and a masked figure has to be explainable from the same screen —
 *    so neither is allowed to live in a tooltip or a settings page.
 *
 *  - **A VIEWER gets one "Request edit access" button, never a screen of
 *    disabled buttons.** `SyncChip` and `RoleBadge` are exported so a page can
 *    make that decision; the shell only guarantees the facts are visible.
 */

import { cx } from "./cx";
import Link from "next/link";
import React, { useState, type ReactNode } from "react";
import styles from "./AppShell.module.css";
import { StatusPill } from "./Display";

/* ==========================================================================
 * Sync chip
 * ========================================================================*/

export type SyncState = "synced" | "pending" | "offline" | "error";

const SYNC_COPY: Record<SyncState, { short: string; long: string }> = {
  synced: { short: "Synced", long: "All changes saved" },
  pending: { short: "Saving", long: "Saving changes" },
  offline: { short: "Offline", long: "Offline — changes queued" },
  error: { short: "Failed", long: "Sync failed" },
};

const SYNC_CLASS: Record<SyncState, string> = {
  synced: styles.syncSynced,
  pending: styles.syncPending,
  offline: styles.syncOffline,
  error: styles.syncError,
};

export interface SyncChipProps {
  state: SyncState;
  /** Number of queued local changes. Shown when there are any. */
  queued?: number;
}

/**
 * Present on every authenticated screen, and announced on every transition.
 *
 * Local-first sync changes what the user is looking at without changing the
 * layout, and silence about that is a correctness bug rather than a polish
 * issue — hence the live region rather than a passive badge.
 */
export function SyncChip({ state, queued }: SyncChipProps) {
  const copy = SYNC_COPY[state];
  const detail = queued && queued > 0 ? `${copy.long}, ${queued} queued` : copy.long;

  return (
    <span
      className={cx(styles.syncChip, SYNC_CLASS[state])}
      role="status"
      aria-live="polite"
      // The visible text is abbreviated at narrow widths, so the full state is
      // carried in the accessible name where it cannot be truncated away.
      aria-label={detail}
    >
      <svg className={styles.syncGlyph} viewBox="0 0 10 10" fill="none" aria-hidden="true">
        {state === "synced" ? (
          <path
            d="M2 5.2 4 7.2l4-4.4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : state === "error" ? (
          <path
            d="M2.6 2.6l4.8 4.8M7.4 2.6l-4.8 4.8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        ) : (
          <circle cx="5" cy="5" r="2.6" fill="currentColor" />
        )}
      </svg>
      <span aria-hidden="true">{copy.short}</span>
      {queued && queued > 0 ? (
        <span aria-hidden="true" className={styles.syncLabelLong}>
          · {queued}
        </span>
      ) : null}
    </span>
  );
}

/* ==========================================================================
 * Role badge
 * ========================================================================*/

export type ProjectRole = "EDITOR" | "VIEWER" | "OWNER";

/** Sits beside the project name: permission changes what every control does. */
export function RoleBadge({ role }: { role: ProjectRole }) {
  return (
    <StatusPill tone={role === "VIEWER" ? "neutral" : "info"}>{role}</StatusPill>
  );
}

/* ==========================================================================
 * Shell
 * ========================================================================*/

/**
 * Default brand: the beacon mark at 26px — the Brand placement table's
 * "Top bar — desktop" size — beside the wordmark. Inlined rather than an
 * `<img>` of the logo file: 26px sits in the 24–39px band of the Brand size
 * ramp, whose full form is drawn at stroke 2.8, not the ≥40px file's 2.5.
 * The wordmark is live text, so the SVG is decorative; labelling it would
 * announce "Cockpit" twice.
 */
const DEFAULT_BRAND = (
  <>
    <svg width={26} height={26} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M 29.99 35.84 A 16 16 0 1 0 18.01 35.84"
        stroke="#3A5060"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M 15 21 A 9 9 0 0 1 33 21"
        stroke="#3A5060"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M 24 28 L 24 41" stroke="#3A5060" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="24" cy="21" r="4" fill="#E5C264" />
    </svg>
    <span>Cockpit</span>
  </>
);

export interface NavItem {
  label: string;
  href: string;
  /** Marks the destination the user is currently in. */
  current?: boolean;
}

export interface AppShellProps {
  children: ReactNode;

  /** Product name shown at the far left. */
  brand?: ReactNode;
  /** Full project name; replaced by `projectCode` on narrow screens. */
  projectName?: string;
  projectCode?: string;
  role?: ProjectRole;

  primaryNav?: NavItem[];
  subNav?: NavItem[];

  /** Global search, rendered in the top bar. */
  search?: ReactNode;
  sync?: SyncChipProps;
  /** Presence, account menu. */
  topBarEnd?: ReactNode;

  /**
   * Cost-visibility level, e.g. "2 of 3". Shown at all times so a masked
   * figure is always explainable from the same screen.
   */
  costVisibility?: string;

  /**
   * Tool surfaces (the Gantt canvas, the diagram editor) own their scroll and
   * width; centring a canvas in a padded 1280px column clips the very thing
   * the screen exists to show. Full-bleed drops the main padding and the
   * max-width, and lays children out as a flex column so a tool can take the
   * remaining viewport with `flex: 1`.
   */
  fullBleed?: boolean;

  className?: string;
}

export function AppShell({
  children,
  brand = DEFAULT_BRAND,
  projectName,
  projectCode,
  role,
  primaryNav,
  subNav,
  search,
  sync,
  topBarEnd,
  costVisibility,
  fullBleed,
  className,
}: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className={cx("ds", styles.shell, className)}>
      <header className={styles.topBar}>
        <Link href="/dashboard" className={styles.brand}>
          {brand}
        </Link>

        {projectName && (
          <>
            <span className={styles.projectName} title={projectName}>
              {projectName}
            </span>
            {projectCode && <span className={styles.projectCode}>{projectCode}</span>}
          </>
        )}
        {role && <RoleBadge role={role} />}

        {primaryNav && primaryNav.length > 0 && (
          <>
            <button
              type="button"
              className={cx(styles.navLink, styles.menuButton)}
              aria-expanded={navOpen}
              aria-controls="ds-primary-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              Menu
            </button>
            <nav
              id="ds-primary-nav"
              aria-label="Primary"
              className={cx(styles.primaryNav, navOpen && styles.primaryNavOpen)}
            >
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(styles.navLink, item.current && styles.navLinkActive)}
                  // The fill is the sighted signal; this is the other one.
                  aria-current={item.current ? "page" : undefined}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </>
        )}

        <span className={styles.topBarSpacer} />
        {search && <div className={styles.topBarSearch}>{search}</div>}

        <div className={styles.topBarEnd}>
          {sync && <SyncChip {...sync} />}
          {topBarEnd}
        </div>
      </header>

      {(subNav?.length || costVisibility) && (
        <div className={styles.subBar}>
          {subNav && subNav.length > 0 && (
            <nav aria-label="Views" className={styles.subNav}>
              {subNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(styles.subLink, item.current && styles.subLinkActive)}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          {costVisibility && (
            <div className={styles.subBarEnd}>
              <span className={styles.meta}>
                Cost visibility
                <span className={styles.metaValue}>{costVisibility}</span>
              </span>
            </div>
          )}
        </div>
      )}

      <main
        className={cx(styles.main, fullBleed && styles.mainFullBleed)}
        id="main-content"
      >
        {fullBleed ? children : <div className={styles.mainInner}>{children}</div>}
      </main>
    </div>
  );
}

/* ==========================================================================
 * Page header and card
 * ========================================================================*/

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cx(styles.pageHeader, className)}>
      <div className={styles.pageTitleWrap}>
        {/* One h1 per screen, and it is the page title — never a panel heading. */}
        <h1 className={styles.pageTitle}>{title}</h1>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </div>
  );
}

export interface CardProps {
  children: ReactNode;
  /** Set false when the child manages its own padding, e.g. a data table. */
  padded?: boolean;
  className?: string;
  /** Renders as a <section> with this accessible name. */
  label?: string;
}

export function Card({ children, padded = true, className, label }: CardProps) {
  const Tag = label ? "section" : "div";
  return (
    <Tag
      className={cx(styles.card, padded && styles.cardPadded, className)}
      aria-label={label}
    >
      {children}
    </Tag>
  );
}
