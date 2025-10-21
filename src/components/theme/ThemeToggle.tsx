/**
 * ThemeToggle - Ant Design Segmented wrapper
 * Theme switcher using Ant Design components
 */

'use client';

import { Segmented, Button } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <Segmented
      options={options}
      value={theme}
      onChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
    />
  );
}

export function ThemeToggleCompact() {
  const { theme, setTheme, systemTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const Icon = effectiveTheme === 'dark' ? BulbFilled : BulbOutlined;

  return (
    <Button
      type="text"
      icon={<Icon />}
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme}`}
    />
  );
}
