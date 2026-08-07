"use client";

/**
 * Design system — SearchInput (layer 2, Primitives)
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
import React, { forwardRef } from "react";
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
      <div className={cx(styles.wrapper, className)}>
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
