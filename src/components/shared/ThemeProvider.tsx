/**
 * ThemeProvider
 * Applies user theme preferences including accent color and density
 */

'use client';

import { ConfigProvider, theme as antTheme } from 'antd';
import { ReactNode, useEffect } from 'react';
import { usePreferencesStore, AccentColor, DensityMode } from '@/stores/preferences-store';

const { defaultAlgorithm, darkAlgorithm, compactAlgorithm } = antTheme;

// Accent color mappings
const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: '#2563eb',
  purple: '#8b5cf6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  teal: '#14b8a6',
};

// Density size mappings
const DENSITY_SIZES: Record<DensityMode, {
  controlHeight: number;
  fontSize: number;
  borderRadius: number;
  padding: number;
  margin: number;
}> = {
  compact: {
    controlHeight: 28,
    fontSize: 13,
    borderRadius: 4,
    padding: 8,
    margin: 8,
  },
  comfortable: {
    controlHeight: 32,
    fontSize: 14,
    borderRadius: 6,
    padding: 12,
    margin: 12,
  },
  spacious: {
    controlHeight: 40,
    fontSize: 15,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = usePreferencesStore((state) => state.theme);
  const accentColor = usePreferencesStore((state) => state.accentColor);
  const densityMode = usePreferencesStore((state) => state.densityMode);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;

    // Apply theme class
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }

    // Apply accent color CSS variable
    const accentValue = ACCENT_COLORS[accentColor];
    root.style.setProperty('--accent', accentValue);
    root.style.setProperty('--accent-strong', adjustColor(accentValue, -20));
    root.style.setProperty('--accent-subtle', adjustColor(accentValue, 90));

    // Apply density mode
    root.setAttribute('data-density', densityMode);
  }, [theme, accentColor, densityMode]);

  // Select algorithm based on theme and density
  const algorithms = [];

  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    algorithms.push(darkAlgorithm);
  } else {
    algorithms.push(defaultAlgorithm);
  }

  if (densityMode === 'compact') {
    algorithms.push(compactAlgorithm);
  }

  const densityConfig = DENSITY_SIZES[densityMode];
  const primaryColor = ACCENT_COLORS[accentColor];

  return (
    <ConfigProvider
      theme={{
        algorithm: algorithms,
        token: {
          colorPrimary: primaryColor,
          borderRadius: densityConfig.borderRadius,
          fontSize: densityConfig.fontSize,
          controlHeight: densityConfig.controlHeight,
          padding: densityConfig.padding,
          margin: densityConfig.margin,
          // Additional comfort
          paddingLG: densityConfig.padding * 1.5,
          paddingMD: densityConfig.padding,
          paddingSM: densityConfig.padding * 0.75,
          paddingXS: densityConfig.padding * 0.5,
          marginLG: densityConfig.margin * 1.5,
          marginMD: densityConfig.margin,
          marginSM: densityConfig.margin * 0.75,
          marginXS: densityConfig.margin * 0.5,
        },
        components: {
          Button: {
            controlHeight: densityConfig.controlHeight,
            fontSize: densityConfig.fontSize,
            paddingContentHorizontal: densityConfig.padding,
          },
          Input: {
            controlHeight: densityConfig.controlHeight,
            fontSize: densityConfig.fontSize,
            paddingBlock: densityMode === 'compact' ? 4 : densityMode === 'comfortable' ? 6 : 8,
          },
          Card: {
            paddingLG: densityConfig.padding * 1.5,
            borderRadiusLG: densityConfig.borderRadius,
          },
          Table: {
            cellPaddingBlock: densityMode === 'compact' ? 8 : densityMode === 'comfortable' ? 12 : 16,
            cellPaddingInline: densityConfig.padding,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

/**
 * Adjust color brightness
 * @param color Hex color code
 * @param percent Percentage to adjust (-100 to 100)
 */
function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
