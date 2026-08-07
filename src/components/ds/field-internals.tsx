"use client";

/**
 * Design system — shared field scaffolding (layer 2, Primitives)
 *
 * Input, Textarea, NumberInput, SearchInput and Select in one module so their
 * accessibility contract cannot drift apart. Every one of them:
 *
 *  - associates its label through `htmlFor`/`id` rather than nesting, so the
 *    label is clickable and the accessible name is unambiguous;
 *  - links helper *and* error text through `aria-describedby`, so a screen
 *    reader hears the explanation with the field rather than after it;
 *  - sets `aria-invalid` when in error, which is what assistive technology
 *    reports — the red border is only the sighted half of that signal;
 *  - reuses one line for helper and error text, so validating a form never
 *    grows the layout and pushes the next field down.
 *
 * Read-only deliberately keeps text at `content/primary`. The value is real;
 * greying it would suggest it is missing.
 */

import { cx } from "./cx";
import React, {
  forwardRef,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import styles from "./Field.module.css";

export { styles as fieldStyles };

export type FieldSize = "sm" | "md" | "lg";

export interface FieldShellProps {
  /** Visible label. Omit only when an external `aria-label` names the field. */
  label?: string;
  size?: FieldSize;
  /** Guidance shown under the field. Replaced by `error` when invalid. */
  helper?: string;
  /** Presence marks the field invalid; the text replaces `helper`. */
  error?: string;
  required?: boolean;
  /** Renders "(optional)" beside the label. Use on forms where most fields are required. */
  optionalHint?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

/** Ids for the control and its description, wired once for every field type. */
export function useFieldWiring(error?: string, helper?: string) {
  const base = useId();
  const controlId = `${base}-control`;
  const describedById = error || helper ? `${base}-desc` : undefined;
  return { controlId, describedById, invalid: Boolean(error) };
}

export function Label({
  htmlFor,
  label,
  required,
  optionalHint,
}: {
  htmlFor: string;
  label?: string;
  required?: boolean;
  optionalHint?: boolean;
}) {
  if (!label) return null;
  return (
    <label className={styles.label} htmlFor={htmlFor}>
      {label}
      {required && (
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      )}
      {optionalHint && !required && <span className={styles.optional}> (optional)</span>}
    </label>
  );
}

export function Description({
  id,
  error,
  helper,
}: {
  id?: string;
  error?: string;
  helper?: string;
}) {
  if (!id) return null;
  return (
    <span className={cx(styles.helper, error && styles.helperError)} id={id}>
      {error ?? helper}
    </span>
  );
}

/** The ✕ shown inside an invalid field. Colour alone never carries the state. */
export function ErrorIcon() {
  return (
    <span className={styles.errorIcon} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M4 4l6 6M10 4l-6 6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function boxClasses(
  size: FieldSize,
  { error, readOnly, disabled }: { error?: string; readOnly?: boolean; disabled?: boolean }
) {
  return cx(
    styles.box,
    styles[size],
    error && styles.error,
    readOnly && styles.readOnly,
    disabled && styles.disabled
  );
}
