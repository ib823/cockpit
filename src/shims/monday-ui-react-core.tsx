/**
 * Lightweight shim for "monday-ui-react-core" mapped to AntD.
 * Only the bits referenced in the codebase are implemented.
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
   Tooltip
   ======================== */
export const Tooltip = AntTooltip;

/* ========================
   Box shim with tokens
   ======================== */
type BoxPaddingTokens = 'NONE' | 'XS' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
type BoxRoundedTokens = 'NONE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
type BoxBorderTokens  = 'NONE' | 'DEFAULT' | 'THICK';

const BOX_PADDINGS: Record<BoxPaddingTokens, number> = {
  NONE: 0,
  XS: 2,
  SMALL: 4,
  MEDIUM: 8,
  LARGE: 16,
  XL: 24,
};

const BOX_ROUNDEDS: Record<BoxRoundedTokens, number> = {
  NONE: 0,
  SMALL: 6,
  MEDIUM: 8,
  LARGE: 12,
  XL: 16,
};

const BOX_BORDERS: Record<BoxBorderTokens, string> = {
  NONE: 'none',
  DEFAULT: '1px solid rgba(0,0,0,0.08)',
  THICK: '2px solid rgba(0,0,0,0.15)',
};

type BoxProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  padding?: number;
  rounded?: number;
  border?: string;
}>;

export const Box: React.FC<BoxProps> & {
  paddings: typeof BOX_PADDINGS;
  roundeds: typeof BOX_ROUNDEDS;
  borders: typeof BOX_BORDERS;
} = Object.assign(
  ({ children, className, style, padding, rounded, border }: BoxProps) => (
    <div
      className={className}
      style={{
        padding,
        borderRadius: rounded,
        border,
        ...style,
      }}
    >
      {children}
    </div>
  ),
  {
    paddings: BOX_PADDINGS,
    roundeds: BOX_ROUNDEDS,
    borders: BOX_BORDERS,
  }
);

/* ========================
   Flex shim with tokens
   ======================== */
const FLEX_DIRECTIONS = {
  ROW: 'row' as const,
  COLUMN: 'column' as const,
};

const FLEX_GAPS = {
  XS: 4,
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 16,
  XL: 24,
};

type FlexProps = React.PropsWithChildren<{
  direction?: 'row' | 'column' | 'ROW' | 'COLUMN';
  gap?: number;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  className?: string;
  style?: React.CSSProperties;
}>;

export const Flex: React.FC<FlexProps> & {
  directions: typeof FLEX_DIRECTIONS;
  gaps: typeof FLEX_GAPS;
} = Object.assign(
  ({ children, className, style, align, justify, direction='row', gap=8 }: FlexProps) => (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: (direction === 'ROW' ? 'row' : (direction === 'COLUMN' ? 'column' : direction)) as React.CSSProperties['flexDirection'],
        gap,
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  ),
  {
    directions: FLEX_DIRECTIONS,
    gaps: FLEX_GAPS,
  }
);

/* ========================
   Chips / Chip
   ======================== */
type ChipProps = React.PropsWithChildren<{
  color?: string;
  onClose?: () => void;
  closable?: boolean;
  style?: React.CSSProperties;
  className?: string;
}>;

export const Chip: React.FC<ChipProps> = ({ children, color, onClose, closable, style, className }) => (
  <Tag color={color as any} closable={closable} onClose={onClose} style={style} className={className}>
    {children}
  </Tag>
);

export const Chips: React.FC<React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>> = ({ children, className, style }) => (
  <Space size={4} wrap className={className} style={style}>{children}</Space>
);

/* ========================
   Icon / IconButton
   ======================== */
type IconProps = React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>;
export const Icon: React.FC<IconProps> = ({ children, className, style }) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', ...style }}>{children}</span>
);

type IconButtonProps = React.ComponentProps<typeof AntButton>;
export const IconButton: React.FC<IconButtonProps> = (props) => <AntButton {...props} />;

/* ========================
   Dropdown / Modal
   ======================== */
export const Dropdown: React.FC<React.ComponentProps<typeof Select>> = (props) => <Select {...props} />;
export const Modal = AntModal;
export const ModalContent: React.FC<React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>> =
  ({ children, className, style }) => <div className={className} style={style}>{children}</div>;

/* ========================
   Typography passthroughs (handy if referenced)
   ======================== */
export const Heading: React.FC<React.PropsWithChildren<{ size?: number }>> =
  ({ children, size = 4 }) => <Typography.Title level={size as any}>{children}</Typography.Title>;
