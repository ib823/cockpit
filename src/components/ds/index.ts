/**
 * Design system — public surface.
 *
 * Import from `@/components/ds` rather than reaching into individual files, so
 * the internal layout can change without touching call sites.
 *
 * Layer 1 (tokens) lives in `src/styles/foundations.css` and is global.
 * Wrap any subtree using these components in `.ds`.
 */

export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Input, Textarea, NumberInput, SearchInput, Select } from "./Field";
export type {
  InputProps,
  TextareaProps,
  NumberInputProps,
  SearchInputProps,
  SelectProps,
  FieldSize,
} from "./Field";

export { Checkbox, Radio, Toggle, ChoiceGroup } from "./Choice";
export type { CheckboxProps, RadioProps, ToggleProps, ChoiceGroupProps } from "./Choice";

export {
  AppShell,
  PageHeader,
  Card,
  SyncChip,
  RoleBadge,
} from "./AppShell";
export type {
  AppShellProps,
  PageHeaderProps,
  CardProps,
  NavItem,
  SyncChipProps,
  SyncState,
  ProjectRole,
} from "./AppShell";

export { AuthShell, AuthStatus, AuthActions, codeInputClass } from "./AuthShell";
export type { AuthShellProps, AuthStatusProps } from "./AuthShell";

export { DataTable } from "./DataTable";
export type { DataTableProps, Column, SortDirection } from "./DataTable";

export { Modal, Drawer } from "./Modal";
export type { ModalProps, DrawerProps } from "./Modal";

export { Banner } from "./Banner";
export type { BannerProps, BannerTone } from "./Banner";
export { EmptyState, ToastProvider, useToast } from "./Feedback";
export type { EmptyStateProps, ToastOptions } from "./Feedback";

export { StatusPill, Badge, Chip, Avatar, Progress, Skeleton } from "./Display";
export type {
  StatusPillProps,
  StatusTone,
  BadgeProps,
  ChipProps,
  AvatarProps,
  ProgressProps,
  SkeletonProps,
} from "./Display";
