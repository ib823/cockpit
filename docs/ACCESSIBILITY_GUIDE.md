# Dashboard Accessibility Guide

## Overview

The SAP Implementation Cockpit dashboards are designed to meet WCAG 2.1 Level AA accessibility standards, ensuring that all users, including those with disabilities, can effectively use the application.

## Key Accessibility Features

### 1. Keyboard Navigation

All dashboard functionality is accessible via keyboard:

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and links
- **Arrow Keys**: Navigate within lists and dropdowns
- **Esc**: Close modals and dropdowns

#### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open export modal | Alt + E |
| Refresh dashboard | Alt + R |
| Open rate card | Alt + C |
| Focus search | / |

### 2. Screen Reader Support

#### ARIA Labels

All icons and visual indicators have descriptive ARIA labels:

```tsx
// Good example
<Button icon={<Download />} aria-label="Export dashboard to PDF">
  Export
</Button>

// Bad example
<Button icon={<Download />}>
  Export
</Button>
```

#### Live Regions

Dynamic content updates are announced to screen readers:

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {autoSaveStatus === 'saved' ? 'Dashboard saved successfully' : 'Saving...'}
</div>
```

#### Semantic HTML

Proper use of semantic HTML elements:

- `<header>` for dashboard header
- `<main>` for main content
- `<nav>` for navigation between views
- `<article>` for independent sections
- `<table>` with `<thead>`, `<tbody>` for data

### 3. Color Contrast

All text meets WCAG AA contrast requirements (4.5:1 minimum):

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Body text | #333333 | #FFFFFF | 12.63:1 ✅ |
| Primary button | #FFFFFF | #667eea | 4.58:1 ✅ |
| Success text | #10B981 | #FFFFFF | 3.21:1 ⚠️ |
| Error text | #EF4444 | #FFFFFF | 4.67:1 ✅ |

⚠️ **Note**: Success text may need adjustment for small font sizes.

### 4. Color Independence

Information is not conveyed by color alone:

#### Resource Heatmap

Color coding is supplemented with text and patterns:

```tsx
// Color + Text + Pattern
<Tooltip title="7 days allocated - Over capacity ⚠️">
  <div
    style={{
      background: '#EF4444',
      border: '2px solid #991b1b', // Additional visual indicator
    }}
    aria-label="Resource over-allocated: 7 days in this week"
  >
    7d
  </div>
</Tooltip>
```

#### Margin Indicators

```tsx
// Good: Color + Icon + Text
<div style={{ color: getMarginColor(margin) }}>
  {margin >= 20 ? '✓' : '⚠️'} {margin}% margin
</div>

// Bad: Color only
<div style={{ color: getMarginColor(margin) }}>
  {margin}%
</div>
```

### 5. Focus Management

#### Focus Indicators

All interactive elements have visible focus indicators:

```css
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
```

#### Focus Trapping

Modals trap focus to prevent focus from escaping:

```tsx
import { FocusTrap } from '@/components/FocusTrap';

<Modal>
  <FocusTrap>
    {/* Modal content */}
  </FocusTrap>
</Modal>
```

#### Focus Restoration

Focus returns to the triggering element when modals close:

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

const handleCloseModal = () => {
  setModalVisible(false);
  buttonRef.current?.focus();
};
```

### 6. Form Accessibility

#### Labels

All form inputs have associated labels:

```tsx
// Good
<label htmlFor="revenue-input">Proposed Revenue (MYR)</label>
<InputNumber id="revenue-input" value={revenue} />

// Bad
<InputNumber placeholder="Enter revenue" />
```

#### Error Messages

Errors are announced and associated with inputs:

```tsx
<div>
  <label htmlFor="revenue">Revenue</label>
  <InputNumber
    id="revenue"
    value={revenue}
    aria-invalid={hasError}
    aria-describedby="revenue-error"
  />
  {hasError && (
    <div id="revenue-error" role="alert">
      Revenue must be greater than zero
    </div>
  )}
</div>
```

### 7. Table Accessibility

Resource heatmap uses proper table structure:

```tsx
<table role="grid">
  <caption>Weekly Resource Allocation</caption>
  <thead>
    <tr>
      <th scope="col">Resource</th>
      <th scope="col">Week 1</th>
      <th scope="col">Week 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Project Manager</th>
      <td aria-label="5 days allocated">5d</td>
      <td aria-label="6 days allocated">6d</td>
    </tr>
  </tbody>
</table>
```

### 8. Charts and Visualizations

Charts provide text alternatives:

```tsx
<div role="img" aria-label="Margin waterfall chart showing revenue of RM 500,000, costs of RM 350,000, and margin of 30%">
  <BarChart data={waterfallData}>
    {/* Chart content */}
  </BarChart>
</div>

<table aria-label="Margin waterfall data table" style={{ srOnly }}>
  <caption>Financial Breakdown</caption>
  <thead>
    <tr>
      <th>Item</th>
      <th>Amount (MYR)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Revenue</td>
      <td>500,000</td>
    </tr>
    <tr>
      <td>Cost</td>
      <td>350,000</td>
    </tr>
    <tr>
      <td>Margin</td>
      <td>150,000 (30%)</td>
    </tr>
  </tbody>
</table>
```

## Testing Accessibility

### Automated Testing

#### 1. axe-core (Recommended)

```bash
npm install -D @axe-core/playwright
```

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard should not have accessibility violations', async ({ page }) => {
  await page.goto('/dashboard-demo');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

#### 2. Lighthouse CI

```bash
npm install -D @lhci/cli
```

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/dashboard-demo"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:performance": ["warn", {"minScore": 0.85}]
      }
    }
  }
}
```

### Manual Testing

#### 1. Keyboard Navigation

1. Navigate to dashboard with Tab key only (no mouse)
2. Verify all interactive elements are reachable
3. Verify focus indicators are visible
4. Verify all actions can be completed

#### 2. Screen Reader Testing

**NVDA (Windows - Free)**
1. Download from https://www.nvaccess.org/
2. Navigate dashboard with NVDA running
3. Verify all content is announced
4. Verify landmarks are properly identified
5. Verify form labels are read correctly

**VoiceOver (macOS - Built-in)**
1. Enable with Cmd+F5
2. Navigate with VO+Arrow keys
3. Test rotor navigation (VO+U)

**JAWS (Windows - Commercial)**
1. Professional screen reader testing
2. Most comprehensive compatibility

#### 3. Color Contrast Testing

**WebAIM Contrast Checker**
- https://webaim.org/resources/contrastchecker/

**Chrome DevTools**
1. Inspect element
2. Open "Accessibility" pane
3. Check "Contrast" section

#### 4. Zoom Testing

Test at different zoom levels:
- 100% (default)
- 200% (WCAG requirement)
- 400% (extreme case)

Verify:
- No horizontal scrolling
- Text remains readable
- Interactive elements remain accessible
- Layout doesn't break

### Browser Testing

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- NVDA/JAWS with browsers

## Common Issues and Fixes

### Issue 1: Missing ARIA Labels

**Problem:**
```tsx
<Button icon={<Settings />} onClick={openSettings} />
```

**Solution:**
```tsx
<Button
  icon={<Settings />}
  onClick={openSettings}
  aria-label="Open rate card settings"
/>
```

### Issue 2: Color-Only Information

**Problem:**
```tsx
<div style={{ color: margin >= 20 ? 'green' : 'red' }}>
  {margin}%
</div>
```

**Solution:**
```tsx
<div style={{ color: getMarginColor(margin) }}>
  {margin >= 20 ? '✓' : '⚠️'} {margin}% margin
  {margin < 20 && ' (below target)'}
</div>
```

### Issue 3: Keyboard Trap

**Problem:**
```tsx
<Modal visible={open}>
  {/* Focus can escape modal */}
</Modal>
```

**Solution:**
```tsx
import FocusTrap from 'focus-trap-react';

<Modal visible={open}>
  <FocusTrap>
    {/* Focus trapped in modal */}
  </FocusTrap>
</Modal>
```

### Issue 4: Missing Form Labels

**Problem:**
```tsx
<InputNumber placeholder="Revenue" />
```

**Solution:**
```tsx
<label htmlFor="revenue-input">
  Proposed Revenue (MYR)
</label>
<InputNumber
  id="revenue-input"
  placeholder="Enter amount"
/>
```

## Resources

### WCAG 2.1 Guidelines
- https://www.w3.org/WAI/WCAG21/quickref/

### Testing Tools
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Pa11y**: Automated testing CLI

### Screen Readers
- **NVDA**: https://www.nvaccess.org/ (Windows, Free)
- **JAWS**: https://www.freedomscientific.com/products/software/jaws/ (Windows, Paid)
- **VoiceOver**: Built into macOS/iOS
- **TalkBack**: Built into Android

### Learning Resources
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

## Accessibility Checklist

### Before Release

- [ ] All images have alt text
- [ ] All icons have ARIA labels
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Keyboard navigation works for all features
- [ ] Focus indicators are visible
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Modals trap and restore focus
- [ ] Tables have proper structure
- [ ] Charts have text alternatives
- [ ] Page has proper heading structure (h1 → h2 → h3)
- [ ] Live regions announce dynamic content
- [ ] Tested with screen reader
- [ ] Tested at 200% zoom
- [ ] Lighthouse accessibility score ≥ 90

---

**Last Updated:** 2025-10-24
**WCAG Version:** 2.1 Level AA
**Testing Status:** Automated + Manual
