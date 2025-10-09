/**
 * Lightweight shim for "monday-ui-react-core" mapped to AntD.
 * Only exports the bits we actually use across the repo.
 */
'use client';
import React from 'react';
import {
  Button as AntButton,
  Divider as AntDivider,
  Input,
  Spin,
  Typography,
  Select,
  Modal as AntModal,
  Tag,
  Space,
  Tooltip as AntTooltip,
} from 'antd';

export const Button = AntButton;
export const Divider = AntDivider;

/* ========================
   TextField / Loader
   ======================== */
export const TextField = Object.assign(
  (props: React.ComponentProps<typeof Input>) => <Input {...props} />,
  { displayName: 'TextField' }
);
export const Loader = Spin;

/* ========================
   Box shim with tokens
   ======================== */
type BoxPaddingTokens = 'NONE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
type BoxRoundedTokens = 'NONE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
type BoxBorderTokens  = 'NONE' | 'DEFAULT' | 'THICK';

const BOX_PADDINGS: Record<BoxPaddingTokens, number> = {
  NONE: 0,
  SMALL: 4,
  MEDIUM: 8,
  LARGE: 16,
  XL: 24,
};

const BOX_ROUNDEDS: Record<BoxRoundedTokens, number> = {
  NONE: 0,
  SMALL: 4,
  MEDIUM: 8,
  LARGE: 12,
  XL: 16,
};

const BOX_BORDERS: Record<BoxBorderTokens, number> = {
  NONE: 0,
  DEFAULT: 1,
  THICK: 2,
};

type BoxProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  /** Pixel value or token via Box.paddings */
  padding?: number;
  /** Pixel value or token via Box.roundeds */
  rounded?: number;
  /** Pixel value or token via Box.borders */
  border?: number;
  /** Optional border color (default neutral) */
  borderColor?: string;
  /** Optional border style (default 'solid') */
  borderStyle?: React.CSSProperties['borderStyle'];
}>;

interface BoxComponent extends React.FC<BoxProps> {
  paddings: typeof BOX_PADDINGS;
  roundeds: typeof BOX_ROUNDEDS;
  borders: typeof BOX_BORDERS;
}

const BoxImpl: React.FC<BoxProps> = ({
  children,
  className,
  style,
  padding,
  rounded,
  border,
  borderColor,
  borderStyle,
}) => {
  const borderWidth = border ?? 0;
  return (
    <div
      className={className}
      style={{
        padding: padding ?? 0,
        borderRadius: rounded ?? 0,
        borderWidth,
        borderStyle: borderWidth ? (borderStyle ?? 'solid') : undefined,
        borderColor: borderWidth ? (borderColor ?? '#e5e7eb') : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Box = Object.assign(BoxImpl, {
  paddings: BOX_PADDINGS,
  roundeds: BOX_ROUNDEDS,
  borders: BOX_BORDERS,
}) as BoxComponent;

/* ========================
   Flex shim with tokens
   ======================== */
type FlexGapTokens = 'NONE' | 'XS' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
const FLEX_GAPS: Record<FlexGapTokens, number> = {
  NONE: 0,
  XS: 4,
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 16,
  XL: 24,
};

const FLEX_DIRECTIONS = {
  ROW: 'row' as const,
  COLUMN: 'column' as const,
};

type FlexProps = React.PropsWithChildren<{
  gap?: number;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  direction?: React.CSSProperties['flexDirection'] | keyof typeof FLEX_DIRECTIONS;
  className?: string;
  style?: React.CSSProperties;
}>;

interface FlexComponent extends React.FC<FlexProps> {
  gaps: typeof FLEX_GAPS;
  directions: typeof FLEX_DIRECTIONS;
}

const FlexImpl: React.FC<FlexProps> = ({
  children,
  gap = 8,
  className,
  style,
  align,
  justify,
  direction,
}) => {
  const pxGap = gap ?? 8;
  const flexDirection =
    direction && (direction === 'ROW' || direction === 'COLUMN')
      ? FLEX_DIRECTIONS[direction]
      : (direction as React.CSSProperties['flexDirection']) || undefined;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: pxGap,
        alignItems: align,
        justifyContent: justify,
        flexDirection,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Flex = Object.assign(FlexImpl, {
  gaps: FLEX_GAPS,
  directions: FLEX_DIRECTIONS,
}) as FlexComponent;

/* ========================
   Heading shim
   ======================== */
export const Heading: React.FC<React.PropsWithChildren<{ size?: 1 | 2 | 3 | 4 | 5 }>> =
  ({ children, size = 4 }) => <Typography.Title level={size as any}>{children}</Typography.Title>;

/* ========================
   Modal + ModalContent
   ======================== */
export const Modal = AntModal;
export const ModalContent: React.FC<React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>> =
  ({ children, className, style }) => <div className={className} style={style}>{children}</div>;

/* ========================
   Dropdown shim (AntD Select)
   ======================== */
type DropdownOption = { label: React.ReactNode; value: string | number };
type DropdownProps = {
  options: DropdownOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  allowClear?: boolean;
  size?: 'small' | 'middle' | 'large';
};
export const Dropdown: React.FC<DropdownProps> = (props) => {
  return <Select {...props} options={props.options} />;
};

/* ========================
   Icon + IconButton shims
   ======================== */
type IconProps = {
  icon?: React.ReactNode;
  component?: React.ReactNode;
  tooltip?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  children?: React.ReactNode;
};
export const Icon: React.FC<IconProps> = ({ icon, component, tooltip, className, style, onClick, children }) => {
  const content = <span className={className} style={style} onClick={onClick}>{icon ?? component ?? children}</span>;
  return tooltip ? <AntTooltip title={tooltip}>{content}</AntTooltip> : content;
};

type IconButtonProps = React.ComponentProps<typeof AntButton> & { tooltip?: React.ReactNode };
export const IconButton: React.FC<IconButtonProps> = ({ tooltip, ...btn }) => {
  const node = <AntButton shape="circle" {...btn} />;
  return tooltip ? <AntTooltip title={tooltip}>{node}</AntTooltip> : node;
};

/* ========================
   Chips shim (AntD Tag + Space)
   ======================== */
type ChipProps = {
  label?: React.ReactNode;
  children?: React.ReactNode;
  onDelete?: () => void;
  onClick?: () => void;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  closable?: boolean;
};
const Chip: React.FC<ChipProps> = ({ label, children, onDelete, onClick, color, icon, className, style, closable }) => {
  const closableFinal = closable ?? Boolean(onDelete);
  return (
    <Tag
      className={className}
      style={style}
      color={color as any}
      onClick={onClick}
      closable={closableFinal}
      onClose={(e) => { e.stopPropagation?.(); onDelete?.(); }}
    >
      {icon ? <span style={{ marginRight: 6 }}>{icon}</span> : null}
      {label ?? children}
    </Tag>
  );
};

type ChipsProps = React.PropsWithChildren<{ gap?: number; className?: string; style?: React.CSSProperties }>;
export const Chips: React.FC<ChipsProps> & { Chip: typeof Chip } = (props => {
  const { children, gap = 8, className, style } = props;
  return (
    <Space wrap size={gap} className={className} style={style}>
      {children}
    </Space>
  );
}) as any;
Chips.Chip = Chip;
export { Chip };

/* ========================
   Tooltip passthrough
   ======================== */
export const Tooltip = AntTooltip;
