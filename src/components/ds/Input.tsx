"use client";

/**
 * Design system — Input (layer 2, Primitives)
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
import React, { forwardRef, type ReactNode, type InputHTMLAttributes } from "react";
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
