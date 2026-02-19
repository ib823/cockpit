/**
 * HelpTooltip Component
 * Provides contextual help throughout the application
 * Uses Ant Design Tooltip with consistent styling
 */

"use client";

import { Tooltip, Typography } from "antd";
import { QuestionCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { ReactNode } from "react";

const { Text } = Typography;

interface HelpTooltipProps {
  title: string;
  description?: string;
  children?: ReactNode;
  type?: "help" | "info";
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight";
  showIcon?: boolean;
  iconStyle?: React.CSSProperties;
}

export function HelpTooltip({
  title,
  description,
  children,
  type = "help",
  placement = "top",
  showIcon = true,
  iconStyle,
}: HelpTooltipProps) {
  const tooltipContent = description ? (
    <div className="max-w-[300px]">
      <Text strong className="block mb-1 text-white">
        {title}
      </Text>
      <Text className="text-white/85 text-[13px]">{description}</Text>
    </div>
  ) : (
    title
  );

  const icon = type === "help" ? <QuestionCircleOutlined /> : <InfoCircleOutlined />;

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
        className="cursor-help text-sm ml-1"
        style={{
          color: "var(--ant-color-text-secondary)",
          ...iconStyle,
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
    <div className="max-w-[320px]">
      <Text strong className="block mb-1 text-white">
        {label} {required && <span className="text-[var(--color-red)]">*</span>}
      </Text>
      <Text
        className={`block text-white/85 text-[13px] ${example ? "mb-2" : ""}`}
      >
        {helpText}
      </Text>
      {example && (
        <>
          <Text
            strong
            className="block mb-0.5 text-white/65 text-xs"
          >
            Example:
          </Text>
          <Text
            code
            className="text-white/85 text-xs bg-black/20 px-1 py-0.5 rounded-sm"
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
        className="cursor-help text-sm ml-1"
        style={{ color: "var(--ant-color-text-secondary)" }}
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
    <div className="max-w-[350px]">
      <Text strong className="block mb-1.5 text-white">
        {feature}
      </Text>
      <Text className="block text-white/85 text-[13px]">
        {description}
      </Text>
      {benefits && benefits.length > 0 && (
        <ul className="mt-2 mb-0 pl-4 text-white/75 text-xs">
          {benefits.map((benefit, idx) => (
            <li key={idx} className="mb-0.5">
              {benefit}
            </li>
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

export function KeyboardShortcutTooltip({
  action,
  shortcuts,
  children,
}: KeyboardShortcutTooltipProps) {
  const content = (
    <div>
      <Text className="block mb-1 text-white">{action}</Text>
      <div className="flex gap-1 flex-wrap">
        {shortcuts.map((shortcut, idx) => (
          <kbd
            key={idx}
            className="bg-black/20 border border-white/20 rounded-[3px] px-1.5 py-0.5 text-[11px] text-white/85 font-mono"
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
