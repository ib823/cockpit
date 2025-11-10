import React from "react";
import clsx from "clsx";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  state?: "default" | "error" | "success";
}

const base =
  "w-full rounded-[var(--r-md)] border bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--gray-500)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] transition-colors";

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", state = "default", className, ...props },
  ref
) {
  const border =
    state === "error"
      ? "border-[var(--error)]"
      : state === "success"
        ? "border-[var(--success)]"
        : "border-[var(--line)]";

  return <input ref={ref} className={clsx(base, sizes[size], border, className)} {...props} />;
});

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: "default" | "error" | "success";
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { state = "default", className, ...props },
  ref
) {
  const border =
    state === "error"
      ? "border-[var(--error)]"
      : state === "success"
        ? "border-[var(--success)]"
        : "border-[var(--line)]";

  return (
    <textarea ref={ref} className={clsx(base, "min-h-[96px] p-3", border, className)} {...props} />
  );
});
