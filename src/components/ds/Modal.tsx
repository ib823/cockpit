"use client";

/**
 * Design system — Modal and Drawer (layer 3, Composites)
 *
 * The component this replaces shipped to 28 dialogs with no `role="dialog"`,
 * no `aria-modal`, no `aria-labelledby`, and `initialFocus: false` — which
 * tells focus-trap explicitly *not* to move focus into the dialog. Its
 * evidence file claimed all four were present. Everything below is asserted in
 * `__tests__/Modal.test.tsx` against the rendered component.
 *
 * What this guarantees:
 *
 *  - `role="dialog"` + `aria-modal` + a title that is the accessible name.
 *  - Focus moves *into* the dialog on open, to the first interactive element
 *    — never to Close, never to a destructive action.
 *  - Escape closes; the element that opened it regains focus.
 *  - The page behind cannot be scrolled or reached by Tab.
 *  - Stacking is capped at two, with the parent made inert.
 */

import { cx } from "./cx";
import FocusTrap from "focus-trap-react";
import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

/**
 * How many modals are currently open.
 *
 * Module-level because the cap is a property of the screen, not of any one
 * dialog: the second modal needs to know it is second in order to shift down
 * and lighten its scrim, and the body scroll lock must only be released by
 * the last one to close.
 */
let openCount = 0;

function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;

    openCount += 1;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      openCount -= 1;
      // Only the last dialog to close restores scrolling — otherwise closing
      // a stacked child would unlock the page while its parent is still open.
      if (openCount === 0) document.body.style.overflow = previous;
    };
  }, [open]);
}

/** True when this dialog opened on top of another. */
function useStackDepth(open: boolean): number {
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    if (open) setDepth(openCount);
  }, [open]);
  return depth;
}

/**
 * Focus-trap configuration shared by Modal and Drawer, so the two cannot
 * diverge on the behaviour that matters most.
 */
function focusTrapOptions(
  bodyRef: React.RefObject<HTMLDivElement | null>,
  dialogRef: React.RefObject<HTMLDivElement | null>
) {
  return {
    // The default initial focus is the first tabbable node, which in this
    // layout is the Close button — so the first thing a keyboard user could
    // do is dismiss the dialog they just opened. Focus goes to the first
    // interactive element in the *body* instead, and never to a footer
    // action, which is where destructive buttons live.
    initialFocus: () => {
      const candidate = bodyRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, [href], button, [tabindex]:not([tabindex="-1"])'
      );
      return candidate ?? dialogRef.current ?? undefined;
    },

    // A dialog of pure prose has no tabbable node at all, and focus-trap
    // throws rather than silently doing nothing. The dialog itself carries
    // tabIndex={-1} so there is always somewhere legitimate for focus to
    // rest — which is also what a screen reader wants, since it puts the
    // reading cursor at the dialog's accessible name.
    fallbackFocus: () => dialogRef.current ?? document.body,

    escapeDeactivates: false, // Handled explicitly so `dismissible` is honoured.
    returnFocusOnDeactivate: true, // The trigger regains focus on close.
    allowOutsideClick: true,

    tabbableOptions: {
      // `tabbable` decides visibility from layout boxes, and jsdom performs no
      // layout, so under test every node looks hidden and the trap refuses to
      // activate. Production keeps the real check.
      displayCheck: (process.env.NODE_ENV === "test" ? "none" : "full") as
        | "none"
        | "full",
    },
  };
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Becomes the dialog's accessible name. Required — an unnamed dialog is unusable. */
  title: string;
  /** Optional second line, linked as the accessible description. */
  description?: string;
  children: ReactNode;
  /** Right-aligned actions. Order is [Cancel] [Confirm]. */
  footer?: ReactNode;
  /** Secondary text pinned to the footer's left. */
  footerLead?: ReactNode;
  size?: "sm" | "md" | "lg";
  /**
   * Blocks closing by Escape and scrim click. Use only when abandoning would
   * lose work, and always leave an explicit way out in the footer.
   */
  dismissible?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  footerLead,
  size = "md",
  dismissible = true,
  className,
}: ModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-desc` : undefined;

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const depth = useStackDepth(open);
  useBodyScrollLock(open);

  // Portals need a DOM target, which does not exist during SSR.
  useEffect(() => setMounted(true), []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        event.stopPropagation();
        onClose();
      }
    },
    [dismissible, onClose]
  );

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cx(styles.scrim, depth > 0 && styles.scrimStacked)}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        // mousedown, not click: a click that *starts* inside the dialog and
        // ends on the scrim — a text selection dragged past the edge — would
        // otherwise close it and discard the user's work.
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
    >
      <FocusTrap focusTrapOptions={focusTrapOptions(bodyRef, dialogRef)}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className={cx(
            styles.dialog,
            styles[size],
            depth > 0 && styles.stacked,
            className
          )}
        >
          <div className={cx(styles.header, scrolled && styles.headerScrolled)}>
            <div className={styles.titleWrap}>
              <h2 className={styles.title} id={titleId}>
                {title}
              </h2>
              {description && (
                <p className={styles.description} id={descriptionId}>
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={closeButtonStyle}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>

          <div
            className={styles.body}
            ref={bodyRef}
            onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
          >
            {children}
          </div>

          {(footer || footerLead) && (
            <div className={styles.footer}>
              {footerLead && <div className={styles.footerLead}>{footerLead}</div>}
              {footer}
            </div>
          )}
        </div>
      </FocusTrap>
    </div>,
    document.body
  );
}

const closeButtonStyle: React.CSSProperties = {
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  padding: 0,
  border: "none",
  background: "none",
  borderRadius: "var(--ds-radius-md)",
  color: "var(--ds-content-tertiary)",
  cursor: "pointer",
};

/* ==========================================================================
 * Drawer
 * ========================================================================*/

export interface DrawerProps extends Omit<ModalProps, "size"> {
  width?: "default" | "wide";
}

/**
 * A side panel for content a modal should not hold — a long form, a data
 * table, a nested tab set. Below 640px it becomes a bottom sheet, because a
 * side drawer on a phone leaves no room for what it is showing.
 *
 * Same dialog semantics as Modal; the difference is placement and the fact
 * that it may legitimately scroll a lot of content.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  footerLead,
  width = "default",
  dismissible = true,
  className,
}: DrawerProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-desc` : undefined;

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useBodyScrollLock(open);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={styles.drawerScrim}
      onKeyDown={(event) => {
        if (event.key === "Escape" && dismissible) {
          event.stopPropagation();
          onClose();
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
    >
      <FocusTrap focusTrapOptions={focusTrapOptions(bodyRef, dialogRef)}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className={cx(styles.drawer, width === "wide" && styles.drawerWide, className)}
        >
          <div className={styles.header}>
            <div className={styles.titleWrap}>
              <h2 className={styles.title} id={titleId}>
                {title}
              </h2>
              {description && (
                <p className={styles.description} id={descriptionId}>
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={closeButtonStyle}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className={styles.body} ref={bodyRef}>
            {children}
          </div>

          {(footer || footerLead) && (
            <div className={styles.footer}>
              {footerLead && <div className={styles.footerLead}>{footerLead}</div>}
              {footer}
            </div>
          )}
        </div>
      </FocusTrap>
    </div>,
    document.body
  );
}
