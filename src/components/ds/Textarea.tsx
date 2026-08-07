"use client";

/**
 * Design system — Textarea (layer 2, Primitives)
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
import React, { forwardRef, type TextareaHTMLAttributes } from "react";
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
    <div className={cx(styles.wrapper, className)}>
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
          className={cx(styles.control, styles.textarea)}
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
