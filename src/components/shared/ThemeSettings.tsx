/**
 * ThemeSettings Component
 * User interface for customizing theme preferences
 */

"use client";

import { Card, Space, Select, Radio, Typography, Divider, Row, Col, Button, message } from "antd";
import { BgColorsOutlined, ColumnHeightOutlined, BulbOutlined } from "@ant-design/icons";
import {
  usePreferencesStore,
  AccentColor,
  DensityMode,
  ThemeMode,
} from "@/stores/preferences-store";
import { HelpTooltip } from "./HelpTooltip";

const { Text } = Typography;

const ACCENT_COLOR_OPTIONS: { value: AccentColor; label: string; color: string }[] = [
  { value: "blue", label: "Blue", color: "var(--color-blue)" },
  { value: "purple", label: "Purple", color: "var(--color-purple)" },
  { value: "green", label: "Green", color: "var(--color-green)" },
  { value: "orange", label: "Orange", color: "var(--color-orange)" },
  { value: "red", label: "Red", color: "var(--color-red)" },
  { value: "teal", label: "Teal", color: "var(--color-teal)" },
];

const DENSITY_OPTIONS: { value: DensityMode; label: string; description: string }[] = [
  { value: "compact", label: "Compact", description: "More content, less spacing" },
  { value: "comfortable", label: "Comfortable", description: "Balanced spacing (default)" },
  { value: "spacious", label: "Spacious", description: "Maximum comfort, larger touch targets" },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Light color scheme" },
  { value: "dark", label: "Dark", description: "Dark color scheme" },
  { value: "system", label: "System", description: "Follow system preference" },
];

const DENSITY_PADDING: Record<DensityMode, number> = {
  compact: 4,
  comfortable: 8,
  spacious: 12,
};

const DENSITY_FONT_SIZE: Record<DensityMode, number> = {
  compact: 12,
  comfortable: 14,
  spacious: 16,
};

interface ThemeSettingsProps {
  compact?: boolean;
}

export function ThemeSettings({ compact = false }: ThemeSettingsProps) {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const accentColor = usePreferencesStore((state) => state.accentColor);
  const setAccentColor = usePreferencesStore((state) => state.setAccentColor);
  const densityMode = usePreferencesStore((state) => state.densityMode);
  const setDensityMode = usePreferencesStore((state) => state.setDensityMode);
  const resetToDefaults = usePreferencesStore((state) => state.resetToDefaults);

  const handleResetTheme = () => {
    resetToDefaults();
    message.success("Theme settings reset to defaults");
  };

  if (compact) {
    return (
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <Text strong className="block mb-2">
            Theme Mode
            <HelpTooltip
              title="Theme Mode"
              description="Choose light, dark, or follow your system preference"
            />
          </Text>
          <Select
            value={theme}
            onChange={setTheme}
            style={{ width: "100%" }}
            options={THEME_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>

        <div>
          <Text strong className="block mb-2">
            Accent Color
            <HelpTooltip
              title="Accent Color"
              description="Choose your preferred accent color for buttons and highlights"
            />
          </Text>
          <Space wrap>
            {ACCENT_COLOR_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => setAccentColor(option.value)}
                className="w-10 h-10 rounded-[var(--radius-md)] cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: option.color,
                  border: accentColor === option.value
                    ? "3px solid var(--color-text-primary)"
                    : "2px solid var(--color-border-subtle)",
                  boxShadow: accentColor === option.value
                    ? "0 0 0 4px rgba(0,0,0,0.1)"
                    : "none",
                }}
                title={option.label}
                role="button"
                aria-label={`Select ${option.label} accent color`}
              />
            ))}
          </Space>
        </div>

        <div>
          <Text strong className="block mb-2">
            Density
            <HelpTooltip title="Density" description="Adjust the spacing and size of UI elements" />
          </Text>
          <Radio.Group
            value={densityMode}
            onChange={(e) => setDensityMode(e.target.value)}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {DENSITY_OPTIONS.map((option) => (
                <Radio key={option.value} value={option.value}>
                  <div>
                    <Text strong>{option.label}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {option.description}
                    </Text>
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
    <Space direction="vertical" style={{ width: "100%" }} size="large">
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
          style={{ width: "100%" }}
        >
          <Row gutter={[16, 16]}>
            {THEME_OPTIONS.map((option) => (
              <Col xs={24} sm={8} key={option.value}>
                <Card
                  hoverable
                  style={{
                    borderColor: theme === option.value ? "var(--accent)" : undefined,
                    borderWidth: theme === option.value ? 2 : 1,
                  }}
                  onClick={() => setTheme(option.value)}
                >
                  <Radio value={option.value} className="mb-2">
                    <Text strong>{option.label}</Text>
                  </Radio>
                  <br />
                  <Text type="secondary" className="text-[13px]">
                    {option.description}
                  </Text>
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
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text type="secondary">Choose your preferred accent color</Text>
          <Row gutter={[16, 16]}>
            {ACCENT_COLOR_OPTIONS.map((option) => (
              <Col xs={12} sm={8} md={4} key={option.value}>
                <div
                  onClick={() => setAccentColor(option.value)}
                  className="text-center cursor-pointer"
                >
                  <div
                    className="w-full h-16 rounded-[var(--radius-lg)] transition-all duration-200"
                    style={{
                      backgroundColor: option.color,
                      border: accentColor === option.value
                        ? "4px solid var(--color-text-primary)"
                        : "2px solid var(--color-border-subtle)",
                      boxShadow: accentColor === option.value
                        ? "var(--shadow-md)"
                        : "none",
                      transform: accentColor === option.value ? "scale(1.05)" : "scale(1)",
                    }}
                    role="button"
                    aria-label={`Select ${option.label} accent color`}
                  />
                  <Text
                    className="block mt-2"
                    style={{
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
          style={{ width: "100%" }}
        >
          <Row gutter={[16, 16]}>
            {DENSITY_OPTIONS.map((option) => (
              <Col xs={24} sm={8} key={option.value}>
                <Card
                  hoverable
                  style={{
                    borderColor: densityMode === option.value ? "var(--accent)" : undefined,
                    borderWidth: densityMode === option.value ? 2 : 1,
                  }}
                  onClick={() => setDensityMode(option.value)}
                >
                  <Radio value={option.value} className="mb-2">
                    <Text strong>{option.label}</Text>
                  </Radio>
                  <br />
                  <Text type="secondary" className="text-[13px]">
                    {option.description}
                  </Text>
                  <Divider className="my-3" />
                  <div
                    className="bg-[var(--surface-sub)] rounded"
                    style={{ padding: DENSITY_PADDING[option.value] }}
                  >
                    <Text style={{ fontSize: DENSITY_FONT_SIZE[option.value] }}>
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
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Reset Theme Settings</Text>
            <br />
            <Text type="secondary" className="text-[13px]">
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
