# Tailwind → Ant Design Migration Guide

This guide provides patterns for migrating from Tailwind CSS to Ant Design v5 tokens and components.

---

## Core Principles

1. **Use Ant Design tokens** via `theme.useToken()` for all styling
2. **Replace layout classes** with Ant Design `Space`, `Flex`, `Grid` components
3. **Replace utility classes** with inline styles using tokens
4. **Remove color classes** - use token colors
5. **Remove spacing classes** - use token spacing

---

## Common Migration Patterns

### Layout & Flexbox

```tsx
// BEFORE (Tailwind)
<div className="flex items-center justify-between gap-4">
  <div>Content</div>
</div>

// AFTER (Ant Design)
import { Flex } from 'antd';

<Flex justify="space-between" align="center" gap={16}>
  <div>Content</div>
</Flex>
```

### Grid Layouts

```tsx
// BEFORE (Tailwind)
<div className="grid grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// AFTER (Ant Design)
import { Row, Col, theme } from 'antd';
const { useToken } = theme;

function Component() {
  const { token } = useToken();

  return (
    <Row gutter={[token.margin, token.margin]}>
      <Col span={8}>Item 1</Col>
      <Col span={8}>Item 2</Col>
      <Col span={8}>Item 3</Col>
    </Row>
  );
}
```

### Spacing

```tsx
// BEFORE (Tailwind)
<div className="px-6 py-3 mb-4">Content</div>

// AFTER (Ant Design)
import { theme } from 'antd';
const { useToken } = theme;

function Component() {
  const { token } = useToken();

  return (
    <div style={{
      paddingInline: token.paddingLG,  // 24px
      paddingBlock: token.padding,      // 16px
      marginBottom: token.margin,       // 16px
    }}>
      Content
    </div>
  );
}
```

### Colors

```tsx
// BEFORE (Tailwind)
<div className="bg-blue-50 text-blue-900 border border-blue-200">
  Content
</div>

// AFTER (Ant Design)
import { theme } from 'antd';
const { useToken } = theme;

function Component() {
  const { token } = useToken();

  return (
    <div style={{
      backgroundColor: token.colorPrimaryBg,
      color: token.colorPrimaryText,
      border: `1px solid ${token.colorPrimaryBorder}`,
    }}>
      Content
    </div>
  );
}
```

### Typography

```tsx
// BEFORE (Tailwind)
<h3 className="text-2xl font-semibold text-gray-900">Title</h3>
<p className="text-sm text-gray-600">Description</p>

// AFTER (Ant Design)
import { Typography } from 'antd';
const { Title, Paragraph } = Typography;

<Title level={3}>Title</Title>
<Paragraph type="secondary">Description</Paragraph>
```

### Buttons

```tsx
// BEFORE (Tailwind)
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click Me
</button>

// AFTER (Ant Design)
import { Button } from 'antd';

<Button type="primary" size="large">
  Click Me
</Button>
```

### Rounded Corners

```tsx
// BEFORE (Tailwind)
<div className="rounded-lg">Content</div>

// AFTER (Ant Design)
import { theme } from 'antd';
const { useToken } = theme;

function Component() {
  const { token } = useToken();

  return (
    <div style={{ borderRadius: token.borderRadiusLG }}>
      Content
    </div>
  );
}
```

### Shadows

```tsx
// BEFORE (Tailwind)
<div className="shadow-lg">Content</div>

// AFTER (Ant Design)
import { theme } from 'antd';
const { useToken } = theme;

function Component() {
  const { token } = useToken();

  return (
    <div style={{ boxShadow: token.boxShadow }}>
      Content
    </div>
  );
}
```

### Responsive Design

```tsx
// BEFORE (Tailwind)
<div className="w-full md:w-1/2 lg:w-1/3">Content</div>

// AFTER (Ant Design)
import { Col } from 'antd';

<Col xs={24} md={12} lg={8}>
  Content
</Col>
```

---

## Token Reference

### Spacing Tokens

| Tailwind | Ant Token | Value |
|----------|-----------|-------|
| `p-1` | `token.paddingXXS` | 4px |
| `p-2` | `token.paddingXS` | 8px |
| `p-3` | `token.paddingSM` | 12px |
| `p-4` | `token.padding` | 16px |
| `p-5` | `token.paddingMD` | 20px |
| `p-6` | `token.paddingLG` | 24px |
| `p-8` | `token.paddingXL` | 32px |

### Color Tokens

| Use Case | Ant Token |
|----------|-----------|
| Primary brand color | `token.colorPrimary` |
| Success green | `token.colorSuccess` |
| Warning yellow | `token.colorWarning` |
| Error red | `token.colorError` |
| Info blue | `token.colorInfo` |
| Text primary | `token.colorText` |
| Text secondary | `token.colorTextSecondary` |
| Border | `token.colorBorder` |
| Background | `token.colorBgContainer` |

### Typography Tokens

| Element | Ant Token |
|---------|-----------|
| H1 | `token.fontSizeHeading1` (38px) |
| H2 | `token.fontSizeHeading2` (30px) |
| H3 | `token.fontSizeHeading3` (24px) |
| H4 | `token.fontSizeHeading4` (20px) |
| H5 | `token.fontSizeHeading5` (16px) |
| Body | `token.fontSize` (14px) |
| Small | `token.fontSizeSM` (12px) |

---

## Component Replacements

### Empty States

```tsx
// BEFORE
<div className="text-center py-8">
  <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
  <h3 className="text-lg font-semibold">No Data</h3>
  <p className="text-sm text-gray-600">Add some items to get started</p>
</div>

// AFTER
import { Empty } from 'antd';

<Empty
  description={
    <>
      <div style={{ fontSize: 16, fontWeight: 600 }}>No Data</div>
      <div style={{ fontSize: 14, marginTop: 8 }}>Add some items to get started</div>
    </>
  }
/>
```

### Cards

```tsx
// BEFORE
<div className="bg-white rounded-lg border border-gray-200 p-6">
  Content
</div>

// AFTER
import { Card } from 'antd';

<Card>
  Content
</Card>
```

### Modals/Overlays

```tsx
// BEFORE
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

// AFTER
import { Modal } from 'antd';
// Ant Modal handles overlay automatically

<Modal open={isOpen} onCancel={onClose}>
  Content
</Modal>
```

---

## Anti-Patterns to Avoid

### ❌ Don't Use Hard-Coded Values

```tsx
// BAD
<div style={{ padding: '24px', margin: '16px' }}>Content</div>

// GOOD
const { token } = useToken();
<div style={{ padding: token.paddingLG, margin: token.margin }}>Content</div>
```

### ❌ Don't Mix Tailwind and Ant

```tsx
// BAD
<div className="flex gap-4" style={{ padding: token.padding }}>Content</div>

// GOOD
<Flex gap={16} style={{ padding: token.padding }}>Content</Flex>
```

### ❌ Don't Use `cn()` Utility

```tsx
// BAD
import { cn } from '@/lib/utils';
<div className={cn('flex items-center', someClass)}>Content</div>

// GOOD
import { Flex } from 'antd';
<Flex align="center" className={someClass}>Content</Flex>
```

---

## Migration Checklist

For each file:

- [ ] Replace `className` with Ant components or inline styles
- [ ] Replace Tailwind flex/grid with `Flex`, `Space`, `Row`, `Col`
- [ ] Replace color classes with token colors
- [ ] Replace spacing classes with token spacing
- [ ] Replace typography classes with `Typography` component
- [ ] Replace custom buttons with `Button` component
- [ ] Replace Lucide icons with `@ant-design/icons` (where appropriate)
- [ ] Remove `cn()` utility imports
- [ ] Remove `clsx` imports
- [ ] Test visually at all breakpoints (xs, sm, md, lg, xl, xxl)

---

## Migration Script

Run this command to find files with Tailwind classes:

```bash
# Find all files with Tailwind classes
npx tsx scripts/ui-health-check.ts | grep "Found.*Tailwind"

# Count total classes
npx tsx scripts/ui-health-check.ts | grep "Tailwind class usages"
```

---

## Need Help?

- See `/src/config/theme.ts` for all available tokens
- See `/src/config/responsive.ts` for breakpoint utilities
- See existing migrated components in `/src/ui/components/`
- Reference: https://ant.design/components/overview
