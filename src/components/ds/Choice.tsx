"use client";

/**
 * Design system — choice controls (layer 2, Primitives)
 *
 * Checkbox, Radio, Toggle and the group wrappers.
 *
 * All three keep a real `<input>` in the DOM at `opacity: 0` over the visual
 * control, rather than replacing it with a `<div role="checkbox">`. That gets
 * the platform's own semantics, keyboard handling, form participation and
 * name/value pairing for free — and those are exactly the parts hand-rolled
 * versions get wrong.
 *
 * Indeterminate is set through the DOM property, because it has no HTML
 * attribute and cannot be expressed in JSX.
 */

import { cn } from "@/lib/utils";
import React, {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import styles from "./Choice.module.css";

interface ChoiceBase extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: ReactNode;
  /** Secondary line under the label. */
  description?: string;
  /** Marks the control invalid and colours the label. */
  error?: boolean;
  /**
   * Shows the value without allowing change. Native inputs have no read-only
   * state for checkboxes or radios, so this is enforced by blocking the
   * interaction and announcing `aria-readonly`.
   */
  readOnly?: boolean;
}

/* ==========================================================================
 * Checkbox
 * ========================================================================*/

export interface CheckboxProps extends ChoiceBase {
  /** Renders the dash glyph and sets the DOM property. */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    description,
    error,
    readOnly,
    indeterminate,
    disabled,
    checked,
    defaultChecked,
    className,
    onClick,
    ...rest
  },
  ref
) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;
  const inner = useRef<HTMLInputElement | null>(null);

  // `indeterminate` exists only as a DOM property — there is no attribute for
  // it, so it cannot be passed through JSX and must be assigned after render.
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  const isOn = Boolean(checked ?? defaultChecked) || Boolean(indeterminate);

  return (
    <label
      className={cn(
        styles.row,
        disabled && styles.disabled,
        readOnly && styles.readOnly,
        className
      )}
    >
      <span style={{ position: "relative", display: "flex" }}>
        <input
          {...rest}
          ref={(node) => {
            inner.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type="checkbox"
          className={styles.input}
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          aria-describedby={descriptionId}
          aria-invalid={error || undefined}
          aria-readonly={readOnly || undefined}
          onClick={(event) => {
            // A read-only checkbox must still be focusable and announced, so
            // it cannot use `disabled`; the change is blocked here instead.
            if (readOnly) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          }}
        />
        <span
          className={cn(
            styles.control,
            styles.box,
            isOn && styles.checkedControl,
            error && styles.errorControl,
            readOnly && styles.readOnlyControl,
            disabled && styles.disabledControl
          )}
        >
          {indeterminate ? (
            <svg className={styles.glyph} viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : isOn ? (
            <svg className={styles.glyph} viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2.5 6.5 5 9l4.5-5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
      </span>
      <span className={styles.labelWrap}>
        <span
          className={cn(
            styles.label,
            error && styles.labelError,
            disabled && styles.labelDisabled
          )}
        >
          {label}
        </span>
        {description && (
          <span className={styles.description} id={descriptionId}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
});

/* ==========================================================================
 * Radio
 * ========================================================================*/

export type RadioProps = ChoiceBase;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    label,
    description,
    error,
    readOnly,
    disabled,
    checked,
    defaultChecked,
    className,
    onClick,
    ...rest
  },
  ref
) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;
  const isOn = Boolean(checked ?? defaultChecked);

  return (
    <label
      className={cn(
        styles.row,
        disabled && styles.disabled,
        readOnly && styles.readOnly,
        className
      )}
    >
      <span style={{ position: "relative", display: "flex" }}>
        <input
          {...rest}
          ref={ref}
          type="radio"
          className={styles.input}
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          aria-describedby={descriptionId}
          // No aria-invalid or aria-readonly here: the `radio` role supports
          // neither. Validity belongs on the enclosing radiogroup, which
          // ChoiceGroup carries. ARIA offers no read-only state for a radio,
          // so an unchangeable one is announced as disabled — which is what
          // it is from the user's point of view — while the visual treatment
          // stays the lighter read-only one.
          aria-disabled={readOnly || undefined}
          onClick={(event) => {
            if (readOnly) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          }}
        />
        <span
          className={cn(
            styles.control,
            styles.circle,
            isOn && styles.checkedControl,
            error && styles.errorControl,
            readOnly && styles.readOnlyControl,
            disabled && styles.disabledControl
          )}
        >
          {isOn && <span className={styles.dot} />}
        </span>
      </span>
      <span className={styles.labelWrap}>
        <span
          className={cn(
            styles.label,
            error && styles.labelError,
            disabled && styles.labelDisabled
          )}
        >
          {label}
        </span>
        {description && (
          <span className={styles.description} id={descriptionId}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
});

/* ==========================================================================
 * Toggle
 * ========================================================================*/

export interface ToggleProps extends Omit<ChoiceBase, "error"> {
  /**
   * The change has been sent but not confirmed. Shown in its own colour
   * rather than as "on", because presenting an unconfirmed change as done is
   * a claim the next refresh may contradict.
   */
  pending?: boolean;
  /** Hides the visible label, keeping it as the accessible name. */
  hideLabel?: boolean;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  {
    label,
    description,
    pending,
    hideLabel,
    readOnly,
    disabled,
    checked,
    defaultChecked,
    className,
    onClick,
    ...rest
  },
  ref
) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;
  const isOn = Boolean(checked ?? defaultChecked);

  return (
    <label
      className={cn(
        styles.row,
        disabled && styles.disabled,
        readOnly && styles.readOnly,
        className
      )}
    >
      <span style={{ position: "relative", display: "flex" }}>
        {/* role="switch" rather than a plain checkbox: it commits immediately,
         * with no Save to press, and screen readers announce on/off instead
         * of checked/unchecked. */}
        <input
          {...rest}
          ref={ref}
          type="checkbox"
          role="switch"
          className={styles.input}
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          aria-describedby={descriptionId}
          aria-readonly={readOnly || undefined}
          aria-busy={pending || undefined}
          onClick={(event) => {
            if (readOnly) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          }}
        />
        <span
          className={cn(
            styles.track,
            isOn && styles.trackOn,
            pending && styles.trackPending,
            disabled && styles.trackDisabled
          )}
        >
          <span
            className={cn(
              styles.knob,
              isOn && styles.knobOn,
              disabled && styles.knobDisabled
            )}
          />
        </span>
      </span>
      <span className={styles.labelWrap}>
        <span
          className={cn(styles.label, disabled && styles.labelDisabled)}
          style={hideLabel ? srOnly : undefined}
        >
          {label}
        </span>
        {description && (
          <span className={styles.description} id={descriptionId}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
});

/** Visually hidden but still in the accessibility tree. */
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/* ==========================================================================
 * Groups
 * ========================================================================*/

export interface ChoiceGroupProps {
  legend: string;
  children: ReactNode;
  /** Guidance under the group. Replaced by `error` when present. */
  helper?: string;
  error?: string;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

/**
 * A fieldset with a legend.
 *
 * Radios especially need this: without a grouping label, a screen reader
 * announces "Fixed price, radio button, 1 of 3" with no indication of what
 * question is being answered.
 */
export function ChoiceGroup({
  legend,
  children,
  helper,
  error,
  orientation = "vertical",
  className,
}: ChoiceGroupProps) {
  const id = useId();
  const descriptionId = error || helper ? `${id}-desc` : undefined;

  return (
    <fieldset
      className={cn(styles.group, className)}
      aria-describedby={descriptionId}
      aria-invalid={Boolean(error) || undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div
        className={cn(styles.group, orientation === "horizontal" && styles.groupHorizontal)}
      >
        {children}
      </div>
      {descriptionId && (
        <span
          className={cn(styles.groupHelper, error && styles.groupError)}
          id={descriptionId}
        >
          {error ?? helper}
        </span>
      )}
    </fieldset>
  );
}
