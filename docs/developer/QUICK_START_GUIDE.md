# UI Toolkit Quick Start Guide

## ✅ Status: Ready to Use!

The UI toolkit has been successfully integrated into your Keystone application. All components are production-ready and backward compatible with your existing code.

## 🚀 Getting Started (3 Steps)

### 1. View the Demo

```bash
npm run dev
# Visit: http://localhost:3000/ui-demo
```

You'll see a live showcase of all 20+ components with:

- Interactive examples
- Light/Dark theme switching
- Toast notifications in action
- Form controls, modals, alerts
- Data tables with token styling
- Navigation components

### 2. Use Your First Component

```tsx
// In any component file
import { Button, useToast } from "@/ui";

function MyComponent() {
  const { push } = useToast();

  return (
    <Button
      onClick={() =>
        push({
          kind: "success",
          title: "Welcome!",
          desc: "You just used the UI toolkit",
        })
      }
    >
      Click Me
    </Button>
  );
}
```

### 3. Explore the Components

Open `/src/ui/README.md` for:

- Complete API reference
- All component props
- Usage examples
- Migration guides

## 📦 What's Available

### Form Components

```tsx
import { Button, Input, Checkbox, Toggle, Select } from '@/ui';

<Button variant="primary" size="md" loading={false}>Submit</Button>
<Input placeholder="Enter text..." state="default" />
<Checkbox checked={value} onChange={setValue} label="Accept" />
<Toggle checked={enabled} onChange={setEnabled} label="Enable" />
<Select options={opts} value={val} onChange={setVal} searchable />
```

### Feedback Components

```tsx
import { Alert, Modal, Tooltip, useToast } from '@/ui';

// Alerts (persistent)
<Alert variant="warning" title="Warning">Important message</Alert>

// Toasts (temporary)
const { push } = useToast();
push({ kind: 'success', title: 'Saved!', desc: 'Changes saved' });

// Modals
<Modal open={isOpen} onClose={close} title="Confirm">
  <p>Are you sure?</p>
</Modal>

// Tooltips
<Tooltip content="Helpful text">
  <Button>Hover me</Button>
</Tooltip>
```

### Navigation Components

```tsx
import { Tabs, Breadcrumb, Pagination } from '@/ui';

<Tabs
  items={[
    { value: 'tab1', label: 'Tab 1', content: <Content1 /> },
    { value: 'tab2', label: 'Tab 2', content: <Content2 /> },
  ]}
/>

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Current' },
  ]}
/>

<Pagination page={page} pageCount={10} onPageChange={setPage} />
```

### Loading States

```tsx
import { Progress, SkeletonText, SkeletonRect } from '@/ui';

<Progress value={75} label="Upload progress" />
<Progress indeterminate label="Processing..." />
<SkeletonText lines={3} />
<SkeletonRect className="h-32 w-full" />
```

### Layout Components

```tsx
import { AppShell, PageHeader } from "@/ui";

<AppShell
  nav={[{ key: "home", label: "Home", active: true }]}
  pageHeader={<PageHeader title="Dashboard" subtitle="Overview" actions={<Button>New</Button>} />}
>
  <YourContent />
</AppShell>;
```

### Data Display

```tsx
import { AntDataGrid } from "@/ui";

<AntDataGrid
  columns={columns}
  dataSource={data}
  density="compact" // 'default' | 'cozy'
  zebra // Alternating row colors
  stickyHeader // Fixed header on scroll
  rowAccentOnHover // Highlight on hover
/>;
```

## 🎨 Theming

### Change Accent Color

```tsx
// In any component or useEffect
document.documentElement.style.setProperty("--accent", "#0a6ed1");
```

### Toggle Dark Mode

```tsx
import { useTheme } from "@/components/theme/ThemeProvider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
```

### Available Tokens

```css
/* Colors */
--accent      /* Primary brand color */
--ink         /* Text color */
--surface     /* Background */
--line        /* Borders */
--canvas      /* Secondary background */
--success     /* Success states */
--warning     /* Warning states */
--error       /* Error states */

/* Spacing (8px grid) */
--s-4, --s-8, --s-12, --s-16, --s-20, --s-24, --s-32, --s-40, --s-48, --s-64

/* Radii */
--r-sm, --r-md, --r-lg, --r-xl, --r-2xl, --r-full

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg

/* Motion */
--dur-fast, --dur, --dur-slow, --ease
```

## 🔄 AntD Integration (Automatic!)

Your existing AntD components are **automatically themed** via `AntDThemeBridge`:

```tsx
import { Button, Table, Modal } from 'antd';

// These now use your CSS tokens automatically!
<Button type="primary">Themed Button</Button>
<Table columns={cols} dataSource={data} />
<Modal visible={open} onCancel={close}>Content</Modal>
```

**No code changes needed** - the bridge reads `--accent`, `--surface`, etc. and applies them to AntD's ConfigProvider.

## 📝 Migration Examples

### Before (AntD)

```tsx
import { Button, message } from "antd";

function MyComponent() {
  const handleClick = () => {
    message.success("Saved!");
  };

  return (
    <Button type="primary" onClick={handleClick}>
      Save
    </Button>
  );
}
```

### After (Toolkit)

```tsx
import { Button, useToast } from "@/ui";

function MyComponent() {
  const { push } = useToast();

  const handleClick = () => {
    push({ kind: "success", title: "Saved!" });
  };

  return (
    <Button variant="primary" onClick={handleClick}>
      Save
    </Button>
  );
}
```

**Migration is optional** - keep using AntD as long as you want. Both work together!

## 🐛 Troubleshooting

### Import Error

```
Module '"@/ui"' has no exported member 'Button'
```

**Fix**: Make sure you're importing from `@/ui`, not `@/ui/components/Button`

### TypeScript Error

```
Property 'variant' does not exist on type 'ButtonProps'
```

**Fix**: Update imports - you might be importing AntD's Button instead of toolkit Button

### Toast Not Showing

**Fix**: Ensure `ToastProvider` is in your app root (already added to `providers.tsx`)

### Modal Not Closing

**Fix**: Make sure you're calling `onClose` when clicking backdrop or escape key

## 🎯 Best Practices

### 1. Import from Root

```tsx
// ✅ Good
import { Button, Input, Modal } from "@/ui";

// ❌ Avoid
import { Button } from "@/ui/components/Button";
```

### 2. Use Tokens for Colors

```tsx
// ✅ Good
className = "text-[var(--ink)] bg-[var(--surface)]";

// ❌ Avoid
className = "text-gray-900 bg-white";
```

### 3. Prefer Toolkit for New Code

```tsx
// ✅ Good - New features use toolkit
import { Button } from "@/ui";

// ⚠️ OK - Existing code can stay on AntD
import { Button } from "antd";
```

### 4. Keep Complex Components on AntD

```tsx
// ✅ Good - Use AntD for complex needs
import { Form, DatePicker, Upload } from "antd";

// ✅ Also Good - Wrap AntD Table for token styling
import { AntDataGrid } from "@/ui";
```

## 📚 Resources

- **Demo Page**: `/ui-demo` - Live examples
- **API Docs**: `/src/ui/README.md` - Component reference
- **Implementation**: `/UI_TOOLKIT_IMPLEMENTATION_SUMMARY.md` - Technical details
- **Tokens**: `/src/styles/tokens.css` - All CSS variables
- **Components**: `/src/ui/components/` - Source code

## 🎉 You're Ready!

The toolkit is fully integrated and ready to use. Start by:

1. ✅ Viewing the demo at `/ui-demo`
2. ✅ Using `Button` and `useToast()` in a new feature
3. ✅ Reading the full docs in `/src/ui/README.md`

**No breaking changes** - your existing code works as-is. Migrate at your own pace!

---

**Questions?** Check the demo page or browse the source code in `/src/ui/`.
