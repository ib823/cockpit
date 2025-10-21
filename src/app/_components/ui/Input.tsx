/**
 * Input Component - Ant Design wrapper with label support
 */

'use client';

import React from 'react';
import { Input as AntInput, Space, Typography } from 'antd';

const { Text } = Typography;

type Props = Omit<React.ComponentProps<typeof AntInput>, 'id'> & {
  id?: string;
  label?: React.ReactNode;
  containerClassName?: string;
};

export default function Input({
  id: providedId,
  label,
  className,
  containerClassName,
  ...rest
}: Props) {
  const generatedId = React.useId();
  const inputId = providedId || generatedId;

  if (!label) {
    return <AntInput id={inputId} className={className} {...rest} />;
  }

  return (
    <Space direction="vertical" size={6} className={containerClassName} style={{ width: '100%' }}>
      <label htmlFor={inputId}>
        <Text style={{ fontSize: 14, fontWeight: 500 }}>{label}</Text>
      </label>
      <AntInput id={inputId} className={className} {...rest} />
    </Space>
  );
}
