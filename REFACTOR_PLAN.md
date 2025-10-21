# Ant Design-Only UI Refactor Plan

**Branch:** `refactor/ant-only-ui`
**Status:** Phase 0-3.2 Complete
**Goal:** Transform SAP Cockpit into a pure Ant Design v5 application with world-class responsive design and WCAG 2.2 AA compliance

---

## ✅ COMPLETED (Phases 0-3.2)

### Phase 0: Prep & Guardrails
- ✅ Created refactor branch
- ✅ ESLint rules to ban Tailwind, non-Ant imports, native HTML elements
- ✅ UI Health Check script (`scripts/ui-health-check.ts`)
- ✅ Ready to remove Tailwind (saved rollback tag)

### Phase 1: Theme & Tokens
- ✅ **Complete theme configuration** with 90+ tokens defined
  - Typography: 9 sizes, 3 line heights
  - Spacing: 8 padding/margin scales (4px base, 8px rhythm)
  - Colors: Semantic colors + text/bg/border scales
  - Motion: Duration + easing functions
  - Shadows: 3 levels
  - Component tokens: Layout, Button, Card, Table, Form, Modal, Input, Select, Menu, Breadcrumb, Typography, Divider, Tabs
- ✅ **Dark mode** fully implemented with `darkAlgorithm`
- ✅ `getTheme(mode)` function for theme switching
- ✅ Token coverage: **~95%** (was 11%)

### Phase 2: Responsive System
- ✅ **`src/config/responsive.ts`** - Ant-aligned breakpoints + `useScreen()` hook
  - Breakpoints: xs<576, sm≥576, md≥768, lg≥992, xl≥1200, xxl≥1600
  - Container max widths: xs=100%, sm=640px, md=768px, lg=1024px, xl=1280px, xxl=1440px
  - Density modes: comfortable (xs/sm), normal (md), compact (lg+)
- ✅ **`src/styles/print.css`** - High-quality print styles for A4/Letter

### Phase 2A: App Layout Components
- ✅ **`src/ui/layout/AppShell.tsx`** - Responsive application shell
  - Header: 56px (mobile), 64px (desktop)
  - Sider: Collapses to Drawer below lg, text-only labels (no decorative icons)
  - Content: Token-driven padding, max-width per breakpoint
  - Footer: Minimal, centered
- ✅ **`src/ui/layout/PageHeader.tsx`** - Responsive page header
  - Title: H3 on xs/sm, H2 on md+
  - Description: 2-line clamp on mobile
  - Actions: Wrap on xs
- ✅ **`src/ui/layout/ContentArea.tsx`** - Content wrapper with background options
- ✅ **`src/config/menu.ts`** - Route → Menu mapping with RBAC + breadcrumb generation

---

## 🚧 IN PROGRESS (Phase 3-8)

### Phase 3.1: Core Controls ✅ COMPLETE
- ✅ Replace all `Button` implementations (4 custom versions → Ant Button)
- ✅ Replace all `Input` implementations (3 custom versions → Ant Input + TextArea)
- ✅ Replace all `Select` implementations (3 custom versions → Ant Select)
- ✅ Remove Radix UI Slider → Ant Slider (WrapperSlider.tsx migrated)
- ✅ Remove react-hot-toast → Ant message/notification
- ✅ Migrate `/dashboard` page to AppShell layout

### Phase 3.2: Feedback Components ✅ COMPLETE
- ✅ Replace Modal/Dialog → Ant Modal (2 implementations with size variants)
- ✅ Replace LoadingScreen → Ant Spin (full-screen with gradient)
- ✅ Replace Alert → Ant Alert (with showIcon and closable)
- ✅ Replace Empty → Ant Empty (2 implementations with custom styling)

### Phase 3: Component Migration (Continued)

**Priority 3: Form Controls (Week 3)**
- [ ] Replace Checkbox → Ant Checkbox
- [ ] Replace Toggle → Ant Switch
- [ ] Replace TextArea → Ant Input.TextArea
- [ ] Remove react-hook-form dependency

**Priority 4: Layout & Nav (Week 4)**
- [ ] Migrate all pages to use AppShell
- [ ] Replace custom Tabs → Ant Tabs
- [ ] Replace custom Breadcrumb → Ant Breadcrumb
- [ ] Replace custom Pagination → Ant Pagination

**Priority 5: Data Display (Week 5)**
- [ ] Replace Badge → Ant Badge
- [ ] Replace Progress → Ant Progress
- [ ] Replace Skeleton → Ant Skeleton
- [ ] Replace Tooltip → Ant Tooltip

### Phase 4: Tailwind Removal
- [ ] Remove all Tailwind utility classes (~7,000 instances)
- [ ] Use Ant Design tokens via `theme.useToken()` for all styling
- [ ] Remove Tailwind config and PostCSS plugin
- [ ] Remove Lucide icons → Standardize on @ant-design/icons (or none)

### Phase 5: Responsive Tables
- [ ] Create `<DataTable />` component with:
  - Column priority (hide low-priority columns on mobile)
  - Card view below md breakpoint
  - Sticky headers on md+
  - Column filtering
  - Skeleton loading states
  - Density toggle (comfortable/normal/compact)
  - Pagination
  - Empty, loading, error states (Ant Empty/Skeleton/Result)

### Phase 6: Responsive Forms
- [ ] Standardize all forms with:
  - Single-column layout on xs/sm
  - Two-column layout on md+ (using Ant Grid)
  - Form.Item with labels, rules, help text, tooltips
  - Affix sticky action buttons on long forms
  - onBlur + onSubmit validation
  - Consistent control heights (40px default, 48px for CTAs on mobile)
  - Focus management for validation errors

### Phase 7: Motion & Accessibility
- [ ] Implement `prefers-reduced-motion` detection
- [ ] Disable Framer Motion animations for users with motion sensitivity
- [ ] Ensure all Ant motion respects preference
- [ ] Fix color contrast issues (text-gray-500, text-gray-400)
- [ ] Add aria-label to all icon-only buttons
- [ ] Verify keyboard navigation in all components
- [ ] Ensure all forms have proper labels and announcements
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Verify 44px minimum touch targets on mobile

### Phase 8: Testing & CI
- [ ] Playwright visual regression tests at all breakpoints
- [ ] Axe-core accessibility tests in CI
- [ ] Grid variance tests (≤1px tolerance)
- [ ] No Tailwind classes (ESLint enforced)
- [ ] No non-Ant UI imports (ESLint enforced)
- [ ] UI Health Check passes in CI

---

## 📊 Progress Metrics

| Metric | Before | Phase 2 | Phase 3.1 | Phase 3.2 | Target |
|--------|--------|---------|-----------|-----------|--------|
| **Ant Token Coverage** | 11% | **95%** ✅ | 95% | 95% | 95%+ ✅ |
| **Dark Mode** | 0% | **100%** ✅ | 100% | 100% | 100% ✅ |
| **Ant Component Usage** | 63 | 63 | **81** 📈 | 85+ 📈 | 200+ |
| **Custom Components** | 40+ | 40+ | **37** 📉 | **31** 📉 | <5 |
| **Tailwind Classes** | ~7,000 | 4,222 | **4,169** 📉 | **4,144** 📉 | 0 |
| **Non-Ant Imports** | 74 | 74 | **69** 📉 | **68** 📉 | 0 |
| **WCAG 2.2 AA Compliance** | 65% | 65% | 65% | 65% | 100% |
| **Responsive Breakpoints** | Inconsistent | **Ant-aligned** ✅ | Ant-aligned | Ant-aligned | Ant-aligned ✅ |
| **UI Health Score** | 62/100 | 25/100 | **27/100** 📈 | **28/100** 📈 | 95+ |

---

## 🏗️ Architecture Decisions

### ✅ Single UI Library
**Ant Design v5 ONLY**. No Tailwind, Radix, MUI, Chakra, or custom component libraries.

### ✅ Token-Driven Design
ALL styling via Ant Design tokens. Zero inline pixel values. Access tokens via `theme.useToken()` hook.

### ✅ Responsive-First
Use `useScreen()` hook for all responsive logic. Follow Ant Grid breakpoints. Mobile-first approach.

### ✅ No Decorative Icons
Icons ONLY when they add meaning or disambiguate. Text labels preferred. @ant-design/icons when needed.

### ✅ 8px Rhythm
Derived from 4px sizeUnit. All spacing via tokens (paddingXS, padding, paddingLG, etc.).

### ✅ WCAG 2.2 AA
Minimum contrast 4.5:1 for small text, 3:1 for large. 44px minimum touch targets. Keyboard navigation. Screen reader support.

### ✅ Dark Mode
Fully supported via `darkAlgorithm`. User toggle + system preference detection.

---

## 📖 Usage Examples

### Theme Provider Setup

```typescript
// src/app/providers.tsx
'use client';

import { ConfigProvider } from 'antd';
import { getTheme } from '@/config/theme';
import { useState, useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setMode(prefersDark ? 'dark' : 'light');

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return (
    <ConfigProvider theme={getTheme(mode)}>
      {children}
    </ConfigProvider>
  );
}
```

### Page with AppShell

```typescript
// src/app/dashboard/page.tsx
'use client';

import { AppShell } from '@/ui/layout/AppShell';
import { PageHeader } from '@/ui/layout/PageHeader';
import { getMenuItems } from '@/config/menu';
import { Button, Card, Row, Col, Statistic, theme } from 'antd';

const { useToken } = theme;

export default function DashboardPage() {
  const { token } = useToken();
  const user = { name: 'John Doe', email: 'john@example.com', role: 'USER' };
  const menuItems = getMenuItems('USER');

  return (
    <AppShell
      user={user}
      menuItems={menuItems}
      breadcrumbItems={[
        { title: 'Home', href: '/' },
        { title: 'Dashboard' },
      ]}
      onLogout={() => console.log('Logout')}
    >
      <PageHeader
        title="Dashboard"
        description="Overview of your SAP implementation projects"
        actions={
          <Button type="primary" size="large">
            New Project
          </Button>
        }
      />

      <Row gutter={[token.margin, token.margin]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Projects" value={12} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Estimates" value={45} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Accuracy" value={92} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Time Saved" value={48} suffix="h" />
          </Card>
        </Col>
      </Row>
    </AppShell>
  );
}
```

### Responsive Component Example

```typescript
'use client';

import { Card, Typography, Space, Button, theme } from 'antd';
import { useScreen } from '@/config/responsive';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

export function ResponsiveCard() {
  const { token } = useToken();
  const { widthKey } = useScreen();

  // Adjust padding based on screen size
  const cardPadding = widthKey === 'xs' || widthKey === 'sm'
    ? token.padding
    : token.paddingLG;

  return (
    <Card
      style={{
        padding: cardPadding,
      }}
    >
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <Title level={widthKey === 'xs' ? 4 : 3}>
          Responsive Card
        </Title>
        <Paragraph>
          This card adapts its padding and typography based on screen size.
        </Paragraph>
        <Button
          type="primary"
          size={widthKey === 'xs' || widthKey === 'sm' ? 'large' : 'middle'}
          block={widthKey === 'xs'}
        >
          Action
        </Button>
      </Space>
    </Card>
  );
}
```

---

## 🔧 Running UI Health Check

```bash
# Check UI health
tsx scripts/ui-health-check.ts

# Example output:
# ✅ Ant Design component usage: 89
# ⚠️  Custom component files: 40
# 🚫 Tailwind class usages: 7000
# 🚫 Non-Ant UI imports: 5
# 📊 Overall Health Score: 70/100
# ❌ FAILED
```

---

## 📅 Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| **Week 1** | Phase 3.1 | Replace Button, Input, Select, Slider |
| **Week 2** | Phase 3.2 | Replace Modal, Alert, Empty, LoadingScreen |
| **Week 3** | Phase 3.3-3.4 | Replace form controls, migrate pages to AppShell |
| **Week 4** | Phase 4 | Remove Tailwind entirely |
| **Week 5** | Phase 5 | Responsive DataTable component |
| **Week 6** | Phase 6 | Standardize all forms |
| **Week 7** | Phase 7 | Accessibility fixes |
| **Week 8** | Phase 8 | Testing, CI, documentation |

**Total:** 8 weeks part-time, or 4-5 weeks dedicated

---

## 🎯 Success Criteria

- [ ] Zero Tailwind classes in codebase
- [ ] Zero non-Ant UI library imports
- [ ] <5 custom components (only when Ant has no equivalent)
- [ ] 95%+ Ant Design token usage
- [ ] 100% WCAG 2.2 AA compliance
- [ ] UI Health Score: 95+/100
- [ ] All tests passing (visual, a11y, grid variance)
- [ ] Dark mode seamless across all breakpoints
- [ ] Zero layout shift
- [ ] 44px+ touch targets on mobile

---

## 📚 Resources

- **Ant Design v5 Docs:** https://ant.design/docs/react/introduce
- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref/
- **Theme Configuration:** `/src/config/theme.ts`
- **Responsive Utilities:** `/src/config/responsive.ts`
- **Layout Components:** `/src/ui/layout/`
- **Audit Report:** `/audit/summary.md`

---

## 🚀 Next Steps

1. **Run UI Health Check:** `tsx scripts/ui-health-check.ts`
2. **Start Phase 3.1:** Replace Button, Input, Select (highest impact)
3. **Update one page as example:** Migrate `/dashboard` to use AppShell
4. **Remove one Tailwind pattern:** Start with spacing utilities
5. **Fix one accessibility issue:** Color contrast for text-gray-500

**Let's ship a world-class, professional, accessible UI! 🎉**
