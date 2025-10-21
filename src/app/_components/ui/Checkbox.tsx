/**
 * Checkbox Component - Ant Design wrapper with label support
 */

'use client';

import React from 'react';
import { Checkbox as AntCheckbox, Space } from 'antd';

type Props = Omit<React.ComponentProps<typeof AntCheckbox>, 'type'> & {
  label?: React.ReactNode;
  containerClassName?: string;
};

export default function Checkbox({
  id: providedId,
  label,
  className,
  containerClassName,
  ...rest
}: Props) {
  const generatedId = React.useId();
  const checkboxId = providedId || generatedId;

  if (!label) {
    return <AntCheckbox id={checkboxId} className={className} {...rest} />;
  }

  return (
    <div className={containerClassName}>
      <AntCheckbox id={checkboxId} className={className} {...rest}>
        {label}
      </AntCheckbox>
    </div>
  );
}
