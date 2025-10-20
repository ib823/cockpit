# Cockpit UI Toolkit

A comprehensive, token-based UI component library for the SAP Cockpit application. Built with React, TypeScript, and Tailwind CSS, featuring seamless AntD integration.

## 🎯 Features

- **Token-based theming** - All components use CSS variables for consistent styling
- **AntD Bridge** - Existing AntD components automatically pick up your theme tokens
- **Full accessibility** - WCAG AA compliant with keyboard navigation and ARIA support
- **Dark mode ready** - All components respond to theme changes
- **Type-safe** - Full TypeScript support with comprehensive prop types
- **Tree-shakeable** - Import only what you need

## 📦 Installation

The UI toolkit is already integrated into your app. Components are available at:

```tsx
import { Button, Input, Modal, Alert } from '@/ui';
```

## 🎨 Theming

### CSS Tokens

All components use CSS variables defined in `/src/styles/tokens.css`:

```css
--accent: #2563eb;           /* Primary brand color */
--surface: #ffffff;          /* Background surfaces */
--ink: #0f172a;             /* Text color */
--line: #e5e7eb;            /* Borders */
--success: #16a34a;         /* Success states */
--warning: #f59e0b;         /* Warning states */
--error: #ef4444;           /* Error states */
```

### Runtime Theme Changes

```tsx
import { useTheme } from '@/components/theme/ThemeProvider';

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

## 🧩 Components

### Core Primitives

#### Button

```tsx
import { Button } from '@/ui';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

**Variants**: `primary`, `secondary`, `ghost`, `danger`
**Sizes**: `xs`, `sm`, `md`, `lg`

#### Input

```tsx
import { Input } from '@/ui';

<Input
  placeholder="Enter text..."
  state="default" // 'error' | 'success'
  size="md"
/>
```

#### Checkbox

```tsx
import { Checkbox } from '@/ui';

<Checkbox
  checked={value}
  onChange={setValue}
  label="Accept terms"
/>
```

#### Toggle (Switch)

```tsx
import { Toggle } from '@/ui';

<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="Enable notifications"
/>
```

### Advanced Components

#### Select

```tsx
import { Select } from '@/ui';

<Select
  options={[
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B', disabled: true },
  ]}
  value={selected}
  onChange={setSelected}
  searchable
  placeholder="Select..."
/>
```

#### Modal

```tsx
import { Modal, Button } from '@/ui';

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

#### Alert

```tsx
import { Alert } from '@/ui';

<Alert variant="warning" title="Warning" onClose={handleClose}>
  This action cannot be undone.
</Alert>
```

**Variants**: `info`, `success`, `warning`, `error`

#### Toast

```tsx
import { useToast } from '@/ui';

function MyComponent() {
  const { push } = useToast();

  const showToast = () => {
    push({
      kind: 'success',
      title: 'Saved!',
      desc: 'Your changes have been saved.',
      duration: 3500
    });
  };

  return <button onClick={showToast}>Save</button>;
}
```

### Navigation Components

#### Tabs

```tsx
import { Tabs } from '@/ui';

<Tabs
  variant="underline" // 'pill' | 'contained'
  items={[
    { value: 'overview', label: 'Overview', content: <Overview /> },
    { value: 'settings', label: 'Settings', content: <Settings /> },
  ]}
  defaultValue="overview"
  onChange={(value) => console.log(value)}
/>
```

#### Breadcrumb

```tsx
import { Breadcrumb } from '@/ui';

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Alpha' }, // Current page
  ]}
/>
```

#### Pagination

```tsx
import { Pagination } from '@/ui';

<Pagination
  page={currentPage}
  pageCount={totalPages}
  onPageChange={setCurrentPage}
  size="md"
/>
```

### Loading States

#### Progress

```tsx
import { Progress } from '@/ui';

<Progress value={75} label="Upload progress" />
<Progress indeterminate label="Processing..." />
```

#### Skeleton

```tsx
import { SkeletonText, SkeletonRect, SkeletonCircle } from '@/ui';

<SkeletonText lines={3} />
<SkeletonRect className="h-32 w-full" />
<SkeletonCircle size={40} />
```

### Layout Components

#### AppShell

```tsx
import { AppShell, PageHeader } from '@/ui';

<AppShell
  nav={[
    { key: 'dashboard', label: 'Dashboard', active: true, href: '/' },
    { key: 'projects', label: 'Projects', href: '/projects' },
  ]}
  pageHeader={
    <PageHeader
      title="Dashboard"
      subtitle="Overview of your projects"
      actions={<Button>New Project</Button>}
    />
  }
>
  {children}
</AppShell>
```

### DataGrid

Enhanced AntD Table with token-based styling:

```tsx
import { AntDataGrid } from '@/ui';
import type { ColumnsType } from 'antd/es/table';

type Row = { key: string; name: string; status: string };

const columns: ColumnsType<Row> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Status', dataIndex: 'status' },
];

<AntDataGrid<Row>
  columns={columns}
  dataSource={data}
  density="compact" // 'default' | 'cozy'
  zebra
  stickyHeader
  rowAccentOnHover
/>
```

## 🎭 AntD Compatibility

### Using the Bridge

All existing AntD components automatically pick up theme tokens via `AntDThemeBridge` in `providers.tsx`:

```tsx
import { Button, Table } from 'antd';

// These will use your CSS tokens automatically
<Button type="primary">AntD Button</Button>
```

### Gradual Migration

Import AntD components via the compat layer:

```tsx
import { AntButton, AntTable } from '@/ui/compat';

// Functionally identical to AntD, but explicitly scoped
<AntButton type="primary">Click me</AntButton>
```

## 🎨 Customization

### Custom Variants

Extend components with your own variants:

```tsx
import { Button, ButtonProps } from '@/ui';
import clsx from 'clsx';

function CustomButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={clsx('bg-gradient-to-r from-purple-500 to-pink-500', className)}
      {...props}
    />
  );
}
```

### Token Overrides

Override tokens at runtime:

```tsx
useEffect(() => {
  document.documentElement.style.setProperty('--accent', '#0a6ed1'); // SAP blue
}, []);
```

## 📱 Responsive Design

All components are mobile-ready:

- AppShell collapses sidebar on mobile
- Tabs scroll horizontally on narrow screens
- Modals are full-screen on mobile
- DataGrid is horizontally scrollable

## ♿ Accessibility

- All interactive components are keyboard accessible
- Focus visible indicators on all focusable elements
- ARIA labels and roles for screen readers
- Color contrast meets WCAG AA standards
- Focus trap in modals
- Live regions for toasts

## 🧪 Testing

Visit `/ui-demo` to see all components in action with live examples.

## 📚 Resources

- [Tokens Reference](/src/styles/tokens.css)
- [Component Source](/src/ui/components/)
- [Layout Components](/src/ui/layout/)
- [AntD Bridge](/src/ui/compat/AntDThemeBridge.tsx)

## 🛠️ Development

### Adding New Components

1. Create component in `/src/ui/components/YourComponent.tsx`
2. Export from `/src/ui/index.ts`
3. Use CSS tokens for all colors/spacing
4. Add TypeScript types for all props
5. Test with dark mode
6. Add to demo page

### Component Checklist

- [ ] Uses CSS tokens (no hardcoded colors)
- [ ] Keyboard accessible
- [ ] ARIA labels where needed
- [ ] Dark mode tested
- [ ] TypeScript types complete
- [ ] Documented in README
- [ ] Added to demo page

## 🤝 Migration Guide

### From AntD to Toolkit

1. **Start with simple replacements:**
   ```tsx
   // Before
   import { Button } from 'antd';

   // After
   import { Button } from '@/ui';
   ```

2. **Use compat layer for complex components:**
   ```tsx
   import { AntTable } from '@/ui/compat';
   ```

3. **Leverage the bridge:**
   All AntD components automatically use your tokens via `AntDThemeBridge`.

### Breaking Changes from AntD

- Modal: `visible` → `open`
- Select: `defaultValue` behavior may differ
- Button: `type` → `variant`

## 📈 Performance

- Components are tree-shakeable
- CSS-in-JS is minimal (mostly CSS variables)
- No runtime style injection
- Lazy loading for modals/toasts

## 🔒 Security

- All user input is sanitized
- No `dangerouslySetInnerHTML` usage
- Content Security Policy compliant

---

**Questions?** Check the demo page at `/ui-demo` or review component source code in `/src/ui/`.
