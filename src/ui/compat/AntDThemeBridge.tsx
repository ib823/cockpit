/**
 * AntDThemeBridge - Connects ThemeProvider to Ant Design theme system
 * Uses the complete theme configuration from src/config/theme.ts
 */

'use client';

import React, { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import { getTheme } from '@/config/theme';

export const AntDThemeBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Detect initial theme
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMode(isDark ? 'dark' : 'light');
    };

    // Initial check
    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      const classChanged = mutations.some(
        (m) => m.type === 'attributes' && m.attributeName === 'class'
      );
      if (classChanged) {
        updateTheme();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider theme={getTheme(mode)}>
      {children}
    </ConfigProvider>
  );
};
