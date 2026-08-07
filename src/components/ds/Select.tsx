"use client";

/**
 * Design system — Select (layer 2, Primitives)
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
import React, { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
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
    <div className={cx(styles.wrapper, className)}>
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
          className={cx(styles.control, styles.select)}
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
