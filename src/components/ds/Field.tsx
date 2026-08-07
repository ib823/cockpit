"use client";

/**
 * Design system — field family (layer 2, Primitives)
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

import { cn } from "@/lib/utils";
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

export type FieldSize = "sm" | "md" | "lg";

interface FieldShellProps {
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
function useFieldWiring(error?: string, helper?: string) {
  const base = useId();
  const controlId = `${base}-control`;
  const describedById = error || helper ? `${base}-desc` : undefined;
  return { controlId, describedById, invalid: Boolean(error) };
}

function Label({
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

function Description({
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
    <span className={cn(styles.helper, error && styles.helperError)} id={id}>
      {error ?? helper}
    </span>
  );
}

/** The ✕ shown inside an invalid field. Colour alone never carries the state. */
function ErrorIcon() {
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

function boxClasses(
  size: FieldSize,
  { error, readOnly, disabled }: { error?: string; readOnly?: boolean; disabled?: boolean }
) {
  return cn(
    styles.box,
    styles[size],
    error && styles.error,
    readOnly && styles.readOnly,
    disabled && styles.disabled
  );
}

/* ==========================================================================
 * Input
 * ========================================================================*/

export interface InputProps
  // `prefix` is a global RDFa attribute typed as `string` in React's DOM
  // types, so it has to be dropped before being redeclared as a node.
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix">,
    FieldShellProps {
  /** Static adornment inside the border — a currency code, a unit. */
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    size = "md",
    helper,
    error,
    required,
    optionalHint,
    disabled,
    readOnly,
    className,
    prefix,
    suffix,
    ...rest
  },
  ref
) {
  const { controlId, describedById, invalid } = useFieldWiring(error, helper);

  return (
    <div className={cn(styles.wrapper, className)}>
      <Label
        htmlFor={controlId}
        label={label}
        required={required}
        optionalHint={optionalHint}
      />
      <div className={boxClasses(size, { error, readOnly, disabled })}>
        {prefix && <span className={styles.adornment}>{prefix}</span>}
        <input
          {...rest}
          ref={ref}
          id={controlId}
          className={styles.control}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedById}
        />
        {invalid && <ErrorIcon />}
        {suffix && <span className={styles.adornment}>{suffix}</span>}
      </div>
      <Description id={describedById} error={error} helper={helper} />
    </div>
  );
});

/* ==========================================================================
 * Textarea
 * ========================================================================*/

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldShellProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    size = "md",
    helper,
    error,
    required,
    optionalHint,
    disabled,
    readOnly,
    className,
    rows = 3,
    ...rest
  },
  ref
) {
  const { controlId, describedById, invalid } = useFieldWiring(error, helper);

  return (
    <div className={cn(styles.wrapper, className)}>
      <Label
        htmlFor={controlId}
        label={label}
        required={required}
        optionalHint={optionalHint}
      />
      <div className={boxClasses(size, { error, readOnly, disabled })}>
        <textarea
          {...rest}
          ref={ref}
          id={controlId}
          rows={rows}
          className={cn(styles.control, styles.textarea)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedById}
        />
      </div>
      <Description id={describedById} error={error} helper={helper} />
    </div>
  );
});

/* ==========================================================================
 * NumberInput
 * ========================================================================*/

export interface NumberInputProps extends Omit<InputProps, "type"> {
  step?: number;
  min?: number;
  max?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      label,
      size = "md",
      helper,
      error,
      required,
      optionalHint,
      disabled,
      readOnly,
      className,
      prefix,
      suffix,
      step = 1,
      min,
      max,
      ...rest
    },
    ref
  ) {
    const { controlId, describedById, invalid } = useFieldWiring(error, helper);
    const inner = useRef<HTMLInputElement | null>(null);

    // Drives the real input so React's onChange fires and any controlled
    // value stays in sync — setting `.value` directly would not notify React.
    const nudge = (direction: 1 | -1) => {
      const el = inner.current;
      if (!el || disabled || readOnly) return;
      if (direction === 1) el.stepUp();
      else el.stepDown();
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };

    return (
      <div className={cn(styles.wrapper, className)}>
        <Label
          htmlFor={controlId}
          label={label}
          required={required}
          optionalHint={optionalHint}
        />
        <div className={boxClasses(size, { error, readOnly, disabled })}>
          {prefix && <span className={styles.adornment}>{prefix}</span>}
          <input
            {...rest}
            ref={(node) => {
              inner.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            id={controlId}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            className={cn(styles.control, styles.numeric)}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedById}
          />
          {suffix && <span className={styles.adornment}>{suffix}</span>}
          {/* Native spinners are hidden because they are inconsistent across
           * browsers and unreachable by keyboard in some. These are real
           * buttons, but aria-hidden: the input already accepts ArrowUp and
           * ArrowDown, so exposing them would add two redundant tab stops to
           * every numeric cell in a table. */}
          <span className={styles.steppers} aria-hidden="true">
            <button
              type="button"
              tabIndex={-1}
              className={styles.stepper}
              disabled={disabled || readOnly}
              onClick={() => nudge(1)}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2.5 6.25 5 3.75l2.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              tabIndex={-1}
              className={styles.stepper}
              disabled={disabled || readOnly}
              onClick={() => nudge(-1)}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2.5 3.75 5 6.25l2.5-2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </span>
          {invalid && <ErrorIcon />}
        </div>
        <Description id={describedById} error={error} helper={helper} />
      </div>
    );
  }
);

/* ==========================================================================
 * SearchInput
 * ========================================================================*/

export interface SearchInputProps extends Omit<InputProps, "prefix" | "suffix" | "type"> {
  /** Shows a clear button once there is a value. */
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      label,
      size = "md",
      helper,
      error,
      disabled,
      readOnly,
      className,
      onClear,
      value,
      placeholder = "Search",
      ...rest
    },
    ref
  ) {
    const { controlId, describedById, invalid } = useFieldWiring(error, helper);
    const hasValue = value !== undefined && value !== "";

    return (
      <div className={cn(styles.wrapper, className)}>
        <Label htmlFor={controlId} label={label} />
        <div className={boxClasses(size, { error, readOnly, disabled })}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M9.5 9.5 12.5 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            {...rest}
            ref={ref}
            id={controlId}
            // `type="search"` would add a second, unstyleable native clear
            // button in WebKit next to this one.
            type="text"
            role="searchbox"
            value={value}
            placeholder={placeholder}
            className={styles.control}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={invalid || undefined}
            aria-describedby={describedById}
          />
          {hasValue && onClear && (
            <button
              type="button"
              className={styles.clear}
              onClick={onClear}
              aria-label="Clear search"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2.5 2.5l5 5M7.5 2.5l-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
        <Description id={describedById} error={error} helper={helper} />
      </div>
    );
  }
);

/* ==========================================================================
 * Select
 * ========================================================================*/

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    FieldShellProps {
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    size = "md",
    helper,
    error,
    required,
    optionalHint,
    disabled,
    className,
    children,
    ...rest
  },
  ref
) {
  const { controlId, describedById, invalid } = useFieldWiring(error, helper);

  return (
    <div className={cn(styles.wrapper, className)}>
      <Label
        htmlFor={controlId}
        label={label}
        required={required}
        optionalHint={optionalHint}
      />
      <div className={boxClasses(size, { error, disabled })}>
        {/* A native <select>: it gets the platform's own keyboard handling,
         * type-ahead and mobile picker for free. A custom listbox would have
         * to reimplement all three, and usually reimplements two. */}
        <select
          {...rest}
          ref={ref}
          id={controlId}
          className={cn(styles.control, styles.select)}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedById}
        >
          {children}
        </select>
        <svg className={styles.chevron} viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M3 4.5 6 7.5 9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <Description id={describedById} error={error} helper={helper} />
    </div>
  );
});
