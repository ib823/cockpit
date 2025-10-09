'use client';
import React from "react";

function cx(...a:any[]){return a.filter(Boolean).join(' ');}

type Props = React.ComponentProps<'input'> & {
  label?: React.ReactNode;
  containerClassName?: string;
};

export default function Input({ id: providedId, label, className, containerClassName, ...rest }: Props){
  const generatedId = React.useId();
  const inputId = providedId || generatedId;
  return (
    <div className={cx('flex flex-col gap-1.5', containerClassName)}>
      {label ? <label htmlFor={inputId} className="text-sm font-medium">{label}</label> : null}
      <input id={inputId} className={cx('border rounded px-3 py-2', className)} {...rest} />
    </div>
  );
}
