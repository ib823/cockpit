'use client';
import React from "react";

function cx(...a:any[]){return a.filter(Boolean).join(' ');}

type Props = Omit<React.ComponentProps<'input'>,'type'> & {
  label?: React.ReactNode;
  containerClassName?: string;
};

export default function Checkbox({ id: providedId, label, className, containerClassName, ...rest }: Props){
  const generatedId = React.useId();
  const checkboxId = providedId || generatedId;
  return (
    <div className={cx('flex flex-col gap-1', containerClassName)}>
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2 text-sm">
        <input id={checkboxId} type="checkbox" className={cx('h-4 w-4', className)} {...rest} />
        {label}
      </label>
    </div>
  );
}
