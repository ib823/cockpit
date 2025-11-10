# Quick Action Plan - Mobile Responsiveness Fixes

**Goal**: Fix critical mobile issues blocking core workflows
**Timeline**: 1-2 weeks
**Estimated Effort**: 20-30 hours total

---

## Priority 0: Critical Blockers (6-8 hours)

### 1. Fix PlanMode Fixed Panel ⚡ **2 hours**

**File**: `src/components/project-v2/modes/PlanMode.tsx:311`

**Change**:

```tsx
// Line 311: BEFORE
className = "fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50";

// Line 311: AFTER
className =
  "fixed right-0 top-0 bottom-0 w-full sm:max-w-sm md:max-w-md lg:w-[480px] bg-white shadow-2xl z-50";
```

**Test**:

- iPhone SE (375px): Panel should be full-width
- iPhone 12 (390px): Panel should be full-width
- iPad (768px): Panel should be max-width ~384px
- Desktop (1024px+): Panel should be 480px

---

### 2. Fix AppLayout Horizontal Scroll ⚡ **30 minutes**

**File**: `src/components/layout/AppLayout.tsx:42`

**Change**:

```tsx
// Line 42: BEFORE
<Layout className="min-h-screen" style={{ width: '100vw' }}>

// Line 42: AFTER
<Layout className="min-h-screen w-full">
```

**Also Fix Line 43**:

```tsx
// Line 43: BEFORE
<Header ... style={{ width: '100%' }}>

// Line 43: AFTER
<Header className="w-full" ...>
```

**Test**:

- No horizontal scroll on any screen size
- Content stays within viewport

---

### 3. Add Hamburger Menu to AppLayout ⚡ **4 hours**

**File**: `src/components/layout/AppLayout.tsx`

**Implementation**:

```tsx
"use client";
import { useState } from "react";
import { Layout, Menu, Drawer } from "antd";
import { MenuOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    {
      key: "project",
      icon: <ProjectOutlined />,
      label: "Project Builder",
      onClick: () => {
        router.push("/project/capture");
        setMobileMenuOpen(false);
      },
    },
    // ... other items
  ];

  return (
    <Layout className="min-h-screen w-full">
      <Header className="w-full bg-white border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 flex-1">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
            <span className="text-lg font-semibold">Keystone</span>
          </div>

          <Menu
            mode="horizontal"
            selectedKeys={[currentPath]}
            items={menuItems}
            className="border-0 flex-1"
          />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between w-full">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            aria-label="Open menu"
          >
            <MenuOutlined className="text-xl" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded" />
            <span className="font-semibold">Keystone</span>
          </div>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex">
          <Space size="middle">
            {session?.user && (
              <>
                <span className="text-sm text-gray-600">{session.user.email}</span>
                <LogoutButton variant="button" theme="light" />
              </>
            )}
          </Space>
        </div>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width="280px"
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
            <span className="text-lg font-semibold">Keystone</span>
          </div>
        </div>

        <Menu mode="vertical" selectedKeys={[currentPath]} items={menuItems} className="border-0" />

        {session?.user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">{session.user.email}</div>
            <LogoutButton variant="button" theme="light" className="w-full" />
          </div>
        )}
      </Drawer>

      <Content className="bg-gray-50 w-full">{children}</Content>
    </Layout>
  );
}
```

**Test**:

- Mobile: Hamburger icon appears, opens drawer
- Desktop: Traditional horizontal menu
- Drawer closes on navigation
- User info visible in both layouts

---

## Priority 1: High Impact (12-16 hours)

### 4. Fix PlanMode Tabs Horizontal Scroll ⚡ **2 hours**

**File**: `src/components/project-v2/modes/PlanMode.tsx:175-224`

**Change**:

```tsx
// Wrap tabs in scrollable container
<div className="overflow-x-auto">
  <div className="flex items-center gap-2 min-w-min">
    {/* Existing tab buttons */}
  </div>
</div>

// OR use Ant Design Tabs component which handles responsive automatically
<Tabs
  items={[
    { key: 'calendar', label: 'Calendar', icon: <CalendarOutlined /> },
    { key: 'benchmarks', label: 'Benchmarks', icon: <BarChartOutlined /> },
    // ...
  ]}
  activeKey={activeTab}
  onChange={setActiveTab}
  className="md:hidden" // Only show on mobile
/>
```

**Test**:

- All tabs accessible on mobile via horizontal scroll
- Scroll indicators visible
- Active tab always visible

---

### 5. Gantt Chart Mobile Solution ⚡ **8-12 hours**

**Option A: Defer to Desktop** (Quick - 2 hours)

```tsx
// File: src/components/gantt-tool/GanttCanvas.tsx

export function GanttCanvas({ ... }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <svg className="w-16 h-16 text-gray-400 mb-4" /* Desktop icon */ />
        <h3 className="text-lg font-semibold mb-2">Desktop View Required</h3>
        <p className="text-gray-600 max-w-md">
          Gantt charts are best viewed on larger screens. Please use a tablet or desktop
          for the full timeline visualization experience.
        </p>
      </div>
    );
  }

  // Existing Gantt implementation
}
```

**Option B: Vertical Task List** (Better UX - 8-12 hours)

```tsx
export function GanttCanvas({ ... }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return <GanttMobileView tasks={tasks} />;
  }

  // Desktop Gantt
}

// New component
function GanttMobileView({ tasks }) {
  return (
    <div className="space-y-2 p-4">
      {tasks.map(task => (
        <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold">{task.name}</h4>
            <span className="text-xs text-gray-500">{task.duration}d</span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            {format(task.start, 'MMM d')} → {format(task.end, 'MMM d')}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          {task.dependencies?.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Depends on: {task.dependencies.join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Test**:

- Mobile: See task list or desktop message
- Tablet: Consider showing simplified Gantt
- Desktop: Full Gantt chart

---

### 6. Add Mobile-Specific Responsive Classes ⚡ **4 hours**

**Systematic Search & Replace**:

```bash
# Find all instances of md: without sm:
grep -r "className.*md:" src/components --include="*.tsx" | grep -v "sm:"

# Common patterns to fix:
```

**Before** → **After**:

```tsx
// Grid columns
"grid grid-cols-2 gap-4"
→ "grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4"

// Text sizing
"text-2xl"
→ "text-xl sm:text-2xl"

// Padding
"p-8"
→ "p-4 sm:p-6 lg:p-8"

// Hidden elements
"md:hidden"
→ "sm:hidden md:block" // If should show on small tablets
```

**Files to prioritize**:

- All mode components (CaptureMode, PlanMode, DecideMode, PresentMode)
- Dashboard components
- Admin pages

---

## Priority 2: Polish (4-6 hours)

### 7. Add Safe Area Insets ⚡ **2 hours**

**File**: `src/app/globals.css`

**Add**:

```css
/* Safe Area Support for Notched Devices */
.safe-top {
  padding-top: calc(1rem + env(safe-area-inset-top));
}

.safe-bottom {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.safe-left {
  padding-left: calc(1rem + env(safe-area-inset-left));
}

.safe-right {
  padding-right: calc(1rem + env(safe-area-inset-right));
}

/* Fixed positioned elements */
.fixed-top-safe {
  top: env(safe-area-inset-top);
}

.fixed-bottom-safe {
  bottom: env(safe-area-inset-bottom);
}
```

**Update all fixed-position components**:

```tsx
// Before
<div className="fixed top-0 left-0 right-0">

// After
<div className="fixed top-0 left-0 right-0 safe-top">
```

**Files to update**:

- ProjectShell bottom nav
- PlanMode panel
- PresentMode controls
- Modal components
- AppLayout header

---

### 8. Modal Max-Width Constraints ⚡ **2 hours**

**Files**: All modal components

**Pattern**:

```tsx
// Before
<Modal open={isOpen} onClose={onClose}>
  <div className="bg-white rounded-lg p-6">
    {/* Content */}
  </div>
</Modal>

// After
<Modal open={isOpen} onClose={onClose}>
  <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg mx-auto">
    {/* Content */}
  </div>
</Modal>
```

**Modal size guide**:

- Small modals: `max-w-sm` (384px) - Confirmations, alerts
- Medium modals: `max-w-lg` (512px) - Forms, settings
- Large modals: `max-w-2xl` (672px) - Complex content
- Extra large: `max-w-4xl` (896px) - Multi-step wizards

---

## Testing Checklist

### Device Testing Matrix

**Browsers**:

- [ ] Chrome (DevTools responsive mode)
- [ ] Safari (actual iPhone if available)
- [ ] Firefox (responsive mode)

**Viewports to Test**:

- [ ] **375px** - iPhone SE, iPhone 12/13 mini (CRITICAL)
- [ ] **390px** - iPhone 12/13/14 (CRITICAL)
- [ ] **414px** - iPhone 12 Pro Max, 13 Pro Max
- [ ] **430px** - iPhone 14 Pro Max
- [ ] **768px** - iPad Mini, tablets (CRITICAL)
- [ ] **1024px** - iPad Pro, small laptops
- [ ] **1280px** - Desktop (CRITICAL)
- [ ] **1920px** - Full HD desktop

### Functionality Testing

**After Each Fix**:

- [ ] No horizontal scroll at any viewport
- [ ] All buttons/links tappable (48×48px minimum)
- [ ] Text readable (not too small)
- [ ] Forms usable (inputs not too narrow)
- [ ] Modals closable
- [ ] Navigation accessible
- [ ] Content not obscured by fixed elements

### Automated Testing

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run mobile performance audit
lhci autorun --collect.url=http://localhost:3000 --collect.settings.preset=mobile

# Check for responsive issues
npm run build
npm run start
# Then use Chrome DevTools "Rendering" > "Emulate CSS media feature prefers-color-scheme"
```

---

## Implementation Schedule

### Week 1 (P0 Critical)

**Day 1-2**:

- [ ] Fix PlanMode panel width
- [ ] Fix AppLayout horizontal scroll
- [ ] Test on iPhone SE, iPad, Desktop

**Day 3-4**:

- [ ] Implement hamburger menu
- [ ] Test navigation on all devices

**Day 5**:

- [ ] Code review
- [ ] Regression testing
- [ ] Deploy to staging

### Week 2 (P1 High Priority)

**Day 1-2**:

- [ ] Fix PlanMode tabs
- [ ] Add mobile-specific responsive classes

**Day 3-5**:

- [ ] Gantt mobile solution (choose option A or B)
- [ ] Test and refine

### Week 3 (P2 Polish)

**Day 1-2**:

- [ ] Safe area insets
- [ ] Modal max-widths

**Day 3-5**:

- [ ] Final testing
- [ ] Documentation
- [ ] Production deployment

---

## Success Metrics

**Before**:

- Mobile usability score: 4/10
- Mobile-blocking issues: 5 critical
- Responsive breakpoint coverage: 40%

**After (Target)**:

- Mobile usability score: 8/10
- Mobile-blocking issues: 0 critical
- Responsive breakpoint coverage: 80%

**Measurement**:

```bash
# Lighthouse mobile score
lhci autorun --preset=mobile

# Viewport coverage
grep -r "xs:\|sm:" src/components --include="*.tsx" | wc -l
grep -r "md:\|lg:" src/components --include="*.tsx" | wc -l
# Ratio should be at least 0.8
```

---

## Quick Reference Commands

```bash
# Start development server
npm run dev

# Build production
npm run build

# Check TypeScript
npm run typecheck

# Check for hardcoded widths
grep -r "w-\[" src/components --include="*.tsx"
grep -r "min-w-\[" src/components --include="*.tsx"

# Find missing responsive classes
grep -r "className.*md:" src/components --include="*.tsx" | grep -v "sm:" | head -20

# Test specific viewport
# Chrome DevTools: Cmd+Shift+M (Mac) or Ctrl+Shift+M (Windows)
# Then select device or enter custom width
```

---

## Getting Help

**Resources**:

- Tailwind CSS Responsive Design: https://tailwindcss.com/docs/responsive-design
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- Nielsen Norman Mobile UX: https://www.nngroup.com/topic/mobile-tablet/

**Testing Tools**:

- Chrome DevTools Device Mode
- BrowserStack (cross-device testing)
- Responsively App (https://responsively.app/)
- Percy (visual regression testing)

---

**Last Updated**: 2025-11-09
**Next Review**: After Week 1 completion
