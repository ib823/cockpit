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

export { Modal, Drawer } from "./Modal";
export type { ModalProps, DrawerProps } from "./Modal";

export { EmptyState, Banner, ToastProvider, useToast } from "./Feedback";
export type {
  EmptyStateProps,
  BannerProps,
  BannerTone,
  ToastOptions,
} from "./Feedback";

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
