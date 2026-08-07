"use client";

/**
 * Design system — NumberInput (layer 2, Primitives)
 *
 * Its own module rather than an export of a combined Field.tsx. A page that
 * wants one field control should not ship five: on /login, bundling them
 * together was the largest remaining contributor to route JS after the
 * tailwind-merge and barrel-import fixes.
 *
 * The shared accessibility scaffolding lives in `field-internals.tsx`, so the
 * controls still cannot drift apart on label association, description linking
 * or invalid state.
 */

import { cx } from "./cx";
import React, { forwardRef, useRef } from "react";
import {
  useFieldWiring,
  Label,
  Description,
  ErrorIcon,
  boxClasses,
  fieldStyles as styles,
  type FieldSize,
  type FieldShellProps,
} from "./field-internals";
import type { InputProps } from "./Input";


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
      <div className={cx(styles.wrapper, className)}>
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
            className={cx(styles.control, styles.numeric)}
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
