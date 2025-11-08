/**
 * HelpTooltip Component
 * Provides contextual help throughout the application
 * Uses Ant Design Tooltip with consistent styling
 */

'use client';

import { Tooltip, Typography } from 'antd';
import { QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

const { Text } = Typography;

interface HelpTooltipProps {
  title: string;
  description?: string;
  children?: ReactNode;
  type?: 'help' | 'info';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  showIcon?: boolean;
  iconStyle?: React.CSSProperties;
}

export function HelpTooltip({
  title,
  description,
  children,
  type = 'help',
  placement = 'top',
  showIcon = true,
  iconStyle
}: HelpTooltipProps) {
  const tooltipContent = description ? (
    <div style={{ maxWidth: 300 }}>
      <Text strong style={{ color: 'white', display: 'block', marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13 }}>{description}</Text>
    </div>
  ) : title;

  const icon = type === 'help' ? <QuestionCircleOutlined /> : <InfoCircleOutlined />;

  if (children) {
    return (
      <Tooltip title={tooltipContent} placement={placement} mouseEnterDelay={0.3}>
        {children}
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipContent} placement={placement} mouseEnterDelay={0.3}>
      <span
        style={{
          cursor: 'help',
          color: 'var(--ant-color-text-secondary)',
          fontSize: 14,
          marginLeft: 4,
          ...iconStyle
        }}
      >
        {showIcon && icon}
      </span>
    </Tooltip>
  );
}

/**
 * FormFieldTooltip
 * Specialized tooltip for form fields
 */
interface FormFieldTooltipProps {
  label: string;
  helpText: string;
  required?: boolean;
  example?: string;
}

export function FormFieldTooltip({ label, helpText, required, example }: FormFieldTooltipProps) {
  const content = (
    <div style={{ maxWidth: 320 }}>
      <Text strong style={{ color: 'white', display: 'block', marginBottom: 4 }}>
        {label} {required && <span style={{ color: '#ff4d4f' }}>*</span>}
      </Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block', marginBottom: example ? 8 : 0 }}>
        {helpText}
      </Text>
      {example && (
        <>
          <Text strong style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, display: 'block', marginBottom: 2 }}>
            Example:
          </Text>
          <Text
            code
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 12,
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '2px 4px',
              borderRadius: 2
            }}
          >
            {example}
          </Text>
        </>
      )}
    </div>
  );

  return (
    <Tooltip title={content} placement="topLeft" mouseEnterDelay={0.3}>
      <QuestionCircleOutlined
        style={{
          cursor: 'help',
          color: 'var(--ant-color-text-secondary)',
          fontSize: 14,
          marginLeft: 4
        }}
      />
    </Tooltip>
  );
}

/**
 * FeatureTooltip
 * Specialized tooltip for feature descriptions
 */
interface FeatureTooltipProps {
  feature: string;
  description: string;
  benefits?: string[];
  children: ReactNode;
}

export function FeatureTooltip({ feature, description, benefits, children }: FeatureTooltipProps) {
  const content = (
    <div style={{ maxWidth: 350 }}>
      <Text strong style={{ color: 'white', display: 'block', marginBottom: 6 }}>{feature}</Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block' }}>
        {description}
      </Text>
      {benefits && benefits.length > 0 && (
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 16, color: 'rgba(255, 255, 255, 0.75)', fontSize: 12 }}>
          {benefits.map((benefit, idx) => (
            <li key={idx} style={{ marginBottom: 2 }}>{benefit}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Tooltip title={content} placement="top" mouseEnterDelay={0.3}>
      {children}
    </Tooltip>
  );
}

/**
 * KeyboardShortcutTooltip
 * Shows keyboard shortcuts in tooltips
 */
interface KeyboardShortcutTooltipProps {
  action: string;
  shortcuts: string[];
  children: ReactNode;
}

export function KeyboardShortcutTooltip({ action, shortcuts, children }: KeyboardShortcutTooltipProps) {
  const content = (
    <div>
      <Text style={{ color: 'white', display: 'block', marginBottom: 4 }}>{action}</Text>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {shortcuts.map((shortcut, idx) => (
          <kbd
            key={idx}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              padding: '2px 6px',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.85)',
              fontFamily: 'monospace'
            }}
          >
            {shortcut}
          </kbd>
        ))}
      </div>
    </div>
  );

  return (
    <Tooltip title={content} placement="bottom" mouseEnterDelay={0.3}>
      {children}
    </Tooltip>
  );
}
