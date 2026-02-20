# Component Library Standards (C-02)

Status: Active
Version: 1.0.0
Last Updated (UTC): 2026-02-20

## 1. Canonical Component Library

**Ant Design v5** is the canonical component library for this project.

All new UI development MUST use Ant Design components as the primary building blocks. Custom components may be created only when no suitable Ant Design component exists for the use case.

## 2. Current Adoption

Ant Design is used across **62 source files** with **43 unique components** and **52 unique icons** from `@ant-design/icons`.

### Core Components (by usage frequency)

| Tier | Components | Files |
|------|-----------|-------|
| Heavy | Button, Space, Input, Tag, Typography, Modal, Card, Select | 13-29 each |
| Medium | Tooltip, Alert, Tabs, Table, Progress, Badge, App, InputNumber, Drawer, Divider | 5-9 each |
| Light | Spin, Form, Empty, Row/Col, Popconfirm, Switch, Segmented, List, Dropdown | 2-4 each |
| Minimal | Upload, Steps, Result, Radio, Popover, Menu, Layout, Descriptions, DatePicker, Avatar | 1 each |

### Theme Configuration

Ant Design theming is configured via `ConfigProvider` in `src/app/providers.tsx` and `src/config/theme.ts`. Theme tokens MUST align with the Apple HIG design token system defined in `src/styles/apple-design-system.css`.

A compatibility bridge exists at `src/ui/compat/AntDThemeBridge.tsx` to synchronize CSS variable tokens with Ant Design's runtime theme.

## 3. Component Selection Rules

### MUST use Ant Design for:
- Buttons, inputs, selects, and form controls
- Modal dialogs and drawers
- Tables and data display
- Navigation (tabs, menus, breadcrumbs)
- Feedback (alerts, messages, notifications, progress)
- Tooltips, popovers, and overlays

### MAY use custom components for:
- Domain-specific visualizations (Gantt charts, org charts, architecture diagrams)
- Highly specialized interactions with no Ant Design equivalent
- Lightweight wrappers that compose multiple Ant Design primitives

### MUST NOT:
- Import competing UI libraries (Material UI, Chakra, Radix primitives, etc.)
- Create custom button, input, modal, or table implementations that duplicate Ant Design functionality
- Override Ant Design styles with `!important` — use `ConfigProvider` theme tokens instead

## 4. Icon Standards

Use `@ant-design/icons` as the primary icon set. `lucide-react` is permitted as a secondary source for icons not available in the Ant Design icon set.

When both libraries offer equivalent icons, prefer `@ant-design/icons` for consistency.

## 5. Custom Shared Components

The following custom shared components supplement Ant Design where domain-specific patterns are needed:

| Component | Location | Purpose |
|-----------|----------|---------|
| Button (custom) | `src/components/shared/Button.tsx` | Extended button with Apple HIG shadows and loading states |
| EmptyState | `src/components/shared/EmptyState.tsx` | Typed empty states with Apple HIG color scheme |
| SkeletonLoaders | `src/components/shared/SkeletonLoaders.tsx` | Domain-specific loading placeholders |
| CommandPalette | `src/components/shared/CommandPalette.tsx` | Cmd+K command palette |
| GlobalSearch | `src/components/shared/GlobalSearch.tsx` | App-wide search overlay |
| ConfirmDialog | `src/components/shared/ConfirmDialog.tsx` | Standardized confirmation flow |
| BaseModal | `src/components/ui/BaseModal.tsx` | Focus-trapped modal wrapper |

## 6. Style Integration

Ant Design components MUST be styled through:
1. **ConfigProvider theme tokens** — for global Ant Design theme alignment
2. **CSS variable overrides** — via `apple-design-system.css` token system
3. **Tailwind utility classes** — for layout, spacing, and composition
4. **`style` prop with Apple HIG hex values** — only when dynamic values are required

Never use Tailwind color classes (e.g., `bg-blue-500`) directly. Use Apple HIG token values (`#007AFF`, `var(--color-blue)`, etc.).

## 7. Migration Debt

The following areas still carry legacy patterns that should be migrated over time:

1. **`src/lib/design-system.ts`** — Tailwind-based `colorValues` object. Gantt-tool components (8 files, ~250 usages) still import from here. Non-gantt consumers have been migrated.
2. **Architecture v1 forms** — 7 files in `src/app/architecture/components/` use Ant Design correctly but have heavy inline styles pending C-04 migration.
3. **Custom Button vs Ant Design Button** — Both exist. The custom `Button` component should eventually be reconciled with Ant Design's `Button` via theme tokens.
