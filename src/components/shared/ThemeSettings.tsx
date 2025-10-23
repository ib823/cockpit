/**
 * ThemeSettings Component
 * User interface for customizing theme preferences
 */

'use client';

import { Card, Space, Select, Radio, Typography, Divider, Row, Col, Button, message } from 'antd';
import { BgColorsOutlined, ColumnHeightOutlined, BulbOutlined } from '@ant-design/icons';
import { usePreferencesStore, AccentColor, DensityMode, ThemeMode } from '@/stores/preferences-store';
import { HelpTooltip } from './HelpTooltip';

const { Title, Text } = Typography;

const ACCENT_COLOR_OPTIONS: { value: AccentColor; label: string; color: string }[] = [
  { value: 'blue', label: 'Blue', color: '#2563eb' },
  { value: 'purple', label: 'Purple', color: '#8b5cf6' },
  { value: 'green', label: 'Green', color: '#10b981' },
  { value: 'orange', label: 'Orange', color: '#f59e0b' },
  { value: 'red', label: 'Red', color: '#ef4444' },
  { value: 'teal', label: 'Teal', color: '#14b8a6' },
];

const DENSITY_OPTIONS: { value: DensityMode; label: string; description: string }[] = [
  { value: 'compact', label: 'Compact', description: 'More content, less spacing' },
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing (default)' },
  { value: 'spacious', label: 'Spacious', description: 'Maximum comfort, larger touch targets' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Light color scheme' },
  { value: 'dark', label: 'Dark', description: 'Dark color scheme' },
  { value: 'system', label: 'System', description: 'Follow system preference' },
];

interface ThemeSettingsProps {
  compact?: boolean;
}

export function ThemeSettings({ compact = false }: ThemeSettingsProps) {
  const theme = usePreferencesStore((state) => state.theme);
  const accentColor = usePreferencesStore((state) => state.accentColor);
  const densityMode = usePreferencesStore((state) => state.densityMode);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const setAccentColor = usePreferencesStore((state) => state.setAccentColor);
  const setDensityMode = usePreferencesStore((state) => state.setDensityMode);
  const resetToDefaults = usePreferencesStore((state) => state.resetToDefaults);

  const handleResetTheme = () => {
    resetToDefaults();
    message.success('Theme settings reset to defaults');
  };

  if (compact) {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Theme Mode
            <HelpTooltip title="Theme Mode" description="Choose light, dark, or follow your system preference" />
          </Text>
          <Select
            value={theme}
            onChange={setTheme}
            style={{ width: '100%' }}
            options={THEME_OPTIONS.map(opt => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Accent Color
            <HelpTooltip title="Accent Color" description="Choose your preferred accent color for buttons and highlights" />
          </Text>
          <Space wrap>
            {ACCENT_COLOR_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => setAccentColor(option.value)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: option.color,
                  cursor: 'pointer',
                  border: accentColor === option.value ? '3px solid #000' : '2px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                  boxShadow: accentColor === option.value ? '0 0 0 4px rgba(0,0,0,0.1)' : 'none',
                }}
                title={option.label}
                role="button"
                aria-label={`Select ${option.label} accent color`}
              />
            ))}
          </Space>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Density
            <HelpTooltip title="Density" description="Adjust the spacing and size of UI elements" />
          </Text>
          <Radio.Group
            value={densityMode}
            onChange={(e) => setDensityMode(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {DENSITY_OPTIONS.map((option) => (
                <Radio key={option.value} value={option.value}>
                  <div>
                    <Text strong>{option.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{option.description}</Text>
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        <Button onClick={handleResetTheme} block>
          Reset to Defaults
        </Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card
        title={
          <Space>
            <BulbOutlined />
            <span>Theme Mode</span>
            <HelpTooltip
              title="Theme Mode"
              description="Choose between light and dark themes, or let the system decide based on your OS settings"
            />
          </Space>
        }
      >
        <Radio.Group
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            {THEME_OPTIONS.map((option) => (
              <Col xs={24} sm={8} key={option.value}>
                <Card
                  hoverable
                  style={{
                    borderColor: theme === option.value ? 'var(--accent)' : undefined,
                    borderWidth: theme === option.value ? 2 : 1,
                  }}
                  onClick={() => setTheme(option.value)}
                >
                  <Radio value={option.value} style={{ marginBottom: 8 }}>
                    <Text strong>{option.label}</Text>
                  </Radio>
                  <br />
                  <Text type="secondary" style={{ fontSize: 13 }}>{option.description}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </Card>

      <Card
        title={
          <Space>
            <BgColorsOutlined />
            <span>Accent Color</span>
            <HelpTooltip
              title="Accent Color"
              description="Customize the primary color used throughout the application for buttons, links, and highlights"
            />
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text type="secondary">Choose your preferred accent color</Text>
          <Row gutter={[16, 16]}>
            {ACCENT_COLOR_OPTIONS.map((option) => (
              <Col xs={12} sm={8} md={4} key={option.value}>
                <div
                  onClick={() => setAccentColor(option.value)}
                  style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 64,
                      borderRadius: 12,
                      backgroundColor: option.color,
                      border: accentColor === option.value ? '4px solid #000' : '2px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      boxShadow: accentColor === option.value ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                      transform: accentColor === option.value ? 'scale(1.05)' : 'scale(1)',
                    }}
                    role="button"
                    aria-label={`Select ${option.label} accent color`}
                  />
                  <Text
                    style={{
                      display: 'block',
                      marginTop: 8,
                      fontWeight: accentColor === option.value ? 600 : 400,
                    }}
                  >
                    {option.label}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <ColumnHeightOutlined />
            <span>Density</span>
            <HelpTooltip
              title="Density"
              description="Adjust the spacing and size of UI elements to match your preference and screen size"
            />
          </Space>
        }
      >
        <Radio.Group
          value={densityMode}
          onChange={(e) => setDensityMode(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            {DENSITY_OPTIONS.map((option) => (
              <Col xs={24} sm={8} key={option.value}>
                <Card
                  hoverable
                  style={{
                    borderColor: densityMode === option.value ? 'var(--accent)' : undefined,
                    borderWidth: densityMode === option.value ? 2 : 1,
                  }}
                  onClick={() => setDensityMode(option.value)}
                >
                  <Radio value={option.value} style={{ marginBottom: 8 }}>
                    <Text strong>{option.label}</Text>
                  </Radio>
                  <br />
                  <Text type="secondary" style={{ fontSize: 13 }}>{option.description}</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{
                    padding: option.value === 'compact' ? 4 : option.value === 'comfortable' ? 8 : 12,
                    background: 'var(--surface-sub)',
                    borderRadius: 4,
                  }}>
                    <Text style={{ fontSize: option.value === 'compact' ? 12 : option.value === 'comfortable' ? 14 : 16 }}>
                      Sample text
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </Card>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Reset Theme Settings</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Reset all theme customizations to default values
            </Text>
          </div>
          <Button onClick={handleResetTheme} danger>
            Reset to Defaults
          </Button>
        </Space>
      </Card>
    </Space>
  );
}
