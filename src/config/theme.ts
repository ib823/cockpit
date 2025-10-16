import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#3b82f6',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#8b5cf6',
    colorTextBase: '#1f2937',
    colorBgBase: '#ffffff',
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    controlHeight: 40,
  },
  components: {
    Button: {
      controlHeight: 44,
      fontSize: 15,
      borderRadius: 10,
      fontWeight: 500,
    },
    Input: {
      controlHeight: 44,
      fontSize: 15,
      borderRadius: 10,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
    },
  },
};
