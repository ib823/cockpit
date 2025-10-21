/**
 * ContentArea - Main content wrapper
 * Provides consistent spacing and background
 */

'use client';

import { theme as antTheme } from 'antd';
import type { ReactNode, CSSProperties } from 'react';

const { useToken } = antTheme;

interface ContentAreaProps {
  children: ReactNode;
  style?: CSSProperties;
  background?: 'transparent' | 'container' | 'elevated';
  padding?: boolean;
}

export function ContentArea({
  children,
  style,
  background = 'transparent',
  padding = false
}: ContentAreaProps) {
  const { token } = useToken();

  const backgroundMap = {
    transparent: 'transparent',
    container: token.colorBgContainer,
    elevated: token.colorBgElevated,
  };

  return (
    <div
      style={{
        background: backgroundMap[background],
        padding: padding ? token.paddingLG : 0,
        borderRadius: background !== 'transparent' ? token.borderRadius : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
