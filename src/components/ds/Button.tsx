"use client";

/**
 * Design system — Button (layer 2, Primitives)
 *
 * Implements the five variants, three sizes and six states in
 * `docs/design/primitives.html`, plus the six rules stated there. Three of
 * those rules are enforced by this file rather than left to the caller:
 *
 *  - **Loading locks the width.** Both labels share one grid cell, so the
 *    control is always as wide as the wider of them and the row cannot reflow
 *    at the moment the action starts.
 *  - **Disabled stays focusable.** `aria-disabled` rather than `disabled`, so
 *    the control can still be reached, explained and tooltipped. Activation is
 *    blocked here instead.
 *  - **An icon-only button must have a name.** The type signature makes
 *    `label` mandatory when `iconOnly` is set, so a nameless icon button will
 *    not compile.
 *
 * The remaining rules are placement decisions this component cannot see:
 * danger must never be the default focus target in a confirm dialog, and
 * disabled is only for a state fixable in the current view — if the reason
 * lies elsewhere (no permission, no cost visibility), keep the button enabled
 * and explain on activation.
 */

import { cx } from "./cx";
// Explicit import: tsconfig uses `jsx: "preserve"` with no automatic runtime,
// which is the convention across this codebase.
import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

interface CommonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon. Replaced by the spinner while loading. */
  icon?: ReactNode;
  /**
   * Blocks activation and greys the control. Use only for a state the user can
   * fix in this view; otherwise leave it enabled and explain on activation.
   */
  disabled?: boolean;
  /** Marks the action in flight: spinner, `aria-busy`, activation blocked. */
  loading?: boolean;
  /**
   * The progressive form of the label — "Save plan" becomes "Saving…". The
   * resting label stays in the layout (hidden) so the width never changes.
   */
  loadingLabel?: string;
  /** Renders the chevron and the menu ARIA pair. */
  menu?: boolean;
  /** Chevron direction and `aria-expanded`. Only meaningful with `menu`. */
  expanded?: boolean;
}

interface TextButtonProps extends CommonProps {
  iconOnly?: false;
  children: ReactNode;
}

interface IconOnlyButtonProps extends CommonProps {
  iconOnly: true;
  /** Required: an icon-only control has no visible text to name it. */
  label: string;
  children?: never;
}

export type ButtonProps = TextButtonProps | IconOnlyButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  props,
  ref
) {
  const {
    variant = "secondary",
    size = "md",
    icon,
    disabled = false,
    loading = false,
    loadingLabel,
    menu = false,
    expanded,
    className,
    onClick,
    type = "button",
    // Pulled out of `rest` so they are never spread onto the DOM node — React
    // warns on unknown attributes, and `iconOnly="true"` in the markup would
    // be meaningless to a browser.
    iconOnly: iconOnlyProp,
    label: labelProp,
    children: childrenProp,
    ...rest
  } = props as CommonProps & {
    iconOnly?: boolean;
    label?: string;
    children?: ReactNode;
  };

  const iconOnly = iconOnlyProp === true;
  const label = iconOnly ? labelProp : undefined;
  const children = iconOnly ? null : childrenProp;

  // Both states block activation, for different reasons: disabled means "not
  // available", busy means "already running". Neither is the `disabled`
  // attribute, so both remain focusable and explainable.
  //
  // They are announced separately on purpose. Setting aria-disabled while
  // merely loading would be wrong twice over: a busy control is not
  // unavailable, and the disabled styling would paint over the loading state
  // that the spec keeps on the filled variant.
  const inactive = disabled || loading;

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        iconOnly && styles.iconOnly,
        className
      )}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      // `label` only exists for icon-only buttons. Written as a fallback
      // rather than an assignment because `aria-label={undefined}` placed
      // after the prop spread silently deletes an aria-label the caller
      // passed — which is how a text button given an explicit name ends up
      // with none at all.
      aria-label={label ?? rest["aria-label"]}
      aria-haspopup={menu ? "menu" : undefined}
      aria-expanded={menu ? Boolean(expanded) : undefined}
      onClick={(event) => {
        if (inactive) {
          // Prevent default too: without it, a form-submitting button still
          // submits, because aria-disabled carries no behaviour of its own.
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {!iconOnly && (
        <span className={styles.labels}>
          {/* The resting label always occupies the cell, so the width is
           * identical in every state. Hidden rather than removed while
           * loading. */}
          <span className={loading ? styles.hiddenLabel : undefined}>{children}</span>
          {loading && loadingLabel ? <span>{loadingLabel}</span> : null}
        </span>
      )}

      {menu && (
        <svg
          className={styles.chevron}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
});
