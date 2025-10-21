/**
 * Ant Design v5 Theme Configuration
 * Complete token-driven design system for SAP Cockpit
 *
 * Design Principles:
 * - Minimalist, professional aesthetic (Apple-clean)
 * - 8px rhythm (derived from 4px sizeUnit)
 * - WCAG 2.2 AA compliant
 * - Token-driven (zero inline styles)
 * - Dark mode ready
 */

import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const { defaultAlgorithm, darkAlgorithm } = theme;

/**
 * Light mode theme (default)
 */
export const lightTheme: ThemeConfig = {
  algorithm: defaultAlgorithm,
  token: {
    // Typography
    fontFamily: "Inter, 'SF Pro Text', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    fontSize: 16,
    fontSizeSM: 14,
    fontSizeLG: 18,
    fontSizeXL: 20,
    fontSizeHeading1: 48,
    fontSizeHeading2: 38,
    fontSizeHeading3: 30,
    fontSizeHeading4: 24,
    fontSizeHeading5: 20,
    lineHeight: 1.6,
    lineHeightSM: 1.57,
    lineHeightLG: 1.66,

    // Brand Colors
    colorPrimary: '#3b82f6',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',

    // Text Colors
    colorText: 'rgba(0,0,0,0.88)',
    colorTextSecondary: 'rgba(0,0,0,0.65)',
    colorTextTertiary: 'rgba(0,0,0,0.45)',
    colorTextQuaternary: 'rgba(0,0,0,0.25)',

    // Background Colors
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f7f8fa',
    colorBgSpotlight: '#fafafa',

    // Border Colors
    colorBorder: '#e5e7eb',
    colorBorderSecondary: '#e5e7eb',

    // Border Radius (8px rhythm)
    borderRadius: 12,
    borderRadiusSM: 8,
    borderRadiusLG: 16,
    borderRadiusXS: 4,

    // Spacing (4px base, 8px rhythm)
    sizeUnit: 4,
    paddingXXS: 4,
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,
    paddingXXL: 48,
    marginXXS: 4,
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    marginXXL: 48,

    // Control Heights
    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 48,
    controlHeightXS: 24,

    // Motion
    motionDurationFast: '120ms',
    motionDurationMid: '200ms',
    motionDurationSlow: '300ms',
    motionEaseInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    motionEaseIn: 'cubic-bezier(0.4, 0.0, 1, 1)',

    // Shadows (subtle, professional)
    boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.07)',
    boxShadowSecondary: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
    boxShadowTertiary: '0 1px 2px rgba(0,0,0,0.02)',

    // Line Width
    lineWidth: 1,
    lineWidthBold: 2,
  },
  components: {
    Layout: {
      headerHeight: 64,
      headerPadding: 16,
      headerBg: '#ffffff',
      bodyBg: '#f7f8fa',
      footerBg: '#ffffff',
      siderBg: '#ffffff',
      triggerBg: '#ffffff',
      triggerColor: 'rgba(0,0,0,0.88)',
    },
    Button: {
      fontWeight: 600,
      defaultBg: '#ffffff',
      defaultBorderColor: '#e5e7eb',
      defaultColor: 'rgba(0,0,0,0.88)',
      primaryShadow: '0 2px 0 rgba(59, 130, 246, 0.1)',
      dangerShadow: '0 2px 0 rgba(239, 68, 68, 0.1)',
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
      boxShadowTertiary: '0 1px 2px rgba(0,0,0,0.04)',
      headerBg: 'transparent',
      headerFontSize: 18,
      headerFontSizeSM: 16,
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0,0,0,0.88)',
      headerSortActiveBg: '#f0f0f0',
      headerSortHoverBg: '#f5f5f5',
      rowHoverBg: '#f5f8ff',
      rowSelectedBg: '#e6f4ff',
      rowSelectedHoverBg: '#d1e9ff',
      borderColor: '#e5e7eb',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      cellPaddingBlockMD: 10,
      cellPaddingInlineMD: 12,
      cellPaddingBlockSM: 8,
      cellPaddingInlineSM: 8,
    },
    Form: {
      itemMarginBottom: 16,
      labelFontSize: 14,
      labelColor: 'rgba(0,0,0,0.65)',
      labelHeight: 32,
      verticalLabelPadding: '0 0 8px',
    },
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
      paddingContentHorizontal: 24,
      paddingMD: 16,
      paddingLG: 24,
      borderRadiusLG: 16,
    },
    Input: {
      paddingBlock: 8,
      paddingInline: 12,
      borderRadius: 8,
      activeBorderColor: '#3b82f6',
      hoverBorderColor: '#93b6fd',
    },
    Select: {
      optionSelectedBg: '#e6f4ff',
      optionActiveBg: '#f5f8ff',
      optionPadding: '8px 12px',
    },
    Menu: {
      itemBg: '#ffffff',
      itemSelectedBg: '#e6f4ff',
      itemSelectedColor: '#3b82f6',
      itemActiveBg: '#f5f8ff',
      itemHeight: 40,
      itemPaddingInline: 16,
      itemBorderRadius: 8,
      iconSize: 18,
      iconMarginInlineEnd: 12,
    },
    Breadcrumb: {
      fontSize: 14,
      itemColor: 'rgba(0,0,0,0.65)',
      linkColor: 'rgba(0,0,0,0.65)',
      linkHoverColor: '#3b82f6',
      lastItemColor: 'rgba(0,0,0,0.88)',
      separatorColor: 'rgba(0,0,0,0.45)',
      separatorMargin: 8,
    },
    Typography: {
      titleMarginBottom: '0.5em',
      titleMarginTop: '1.2em',
    },
    Divider: {
      marginLG: 24,
      margin: 16,
      marginXS: 8,
    },
    Tabs: {
      itemActiveColor: '#3b82f6',
      itemHoverColor: '#3b82f6',
      itemSelectedColor: '#3b82f6',
      inkBarColor: '#3b82f6',
      cardBg: '#ffffff',
      cardPadding: '12px 16px',
      cardPaddingSM: '8px 12px',
      cardPaddingLG: '16px 24px',
    },
  },
};

/**
 * Dark mode theme
 */
export const darkTheme: ThemeConfig = {
  algorithm: darkAlgorithm,
  token: {
    ...lightTheme.token,
    // Override colors for dark mode
    colorText: 'rgba(255,255,255,0.85)',
    colorTextSecondary: 'rgba(255,255,255,0.65)',
    colorTextTertiary: 'rgba(255,255,255,0.45)',
    colorTextQuaternary: 'rgba(255,255,255,0.25)',
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#0a0a0a',
    colorBgSpotlight: '#262626',
    colorBorder: '#303030',
    colorBorderSecondary: '#303030',
  },
  components: {
    ...lightTheme.components,
    Layout: {
      ...lightTheme.components?.Layout,
      headerBg: '#1f1f1f',
      bodyBg: '#0a0a0a',
      footerBg: '#1f1f1f',
      siderBg: '#1f1f1f',
      triggerBg: '#1f1f1f',
      triggerColor: 'rgba(255,255,255,0.85)',
    },
    Button: {
      ...lightTheme.components?.Button,
      defaultBg: '#1f1f1f',
      defaultBorderColor: '#303030',
      defaultColor: 'rgba(255,255,255,0.85)',
    },
    Card: {
      ...lightTheme.components?.Card,
      boxShadowTertiary: '0 1px 2px rgba(0,0,0,0.3)',
    },
    Table: {
      ...lightTheme.components?.Table,
      headerBg: '#262626',
      headerColor: 'rgba(255,255,255,0.85)',
      headerSortActiveBg: '#303030',
      headerSortHoverBg: '#2a2a2a',
      rowHoverBg: '#2a2a2a',
      rowSelectedBg: '#1a3a5a',
      rowSelectedHoverBg: '#1e4570',
      borderColor: '#303030',
    },
    Modal: {
      ...lightTheme.components?.Modal,
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
      footerBg: '#1f1f1f',
    },
    Menu: {
      ...lightTheme.components?.Menu,
      itemBg: '#1f1f1f',
      itemSelectedBg: '#1a3a5a',
      itemActiveBg: '#2a2a2a',
    },
  },
};

/**
 * Get theme based on mode
 */
export function getTheme(mode: 'light' | 'dark' = 'light'): ThemeConfig {
  return mode === 'dark' ? darkTheme : lightTheme;
}
