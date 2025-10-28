# UI Component Migration Guide

This guide helps you replace all old UI components with the new animated versions throughout the codebase.

## New Components Created

### 1. **CubeSpinner** - 3D Rotating Cube Spinner
Location: `src/components/common/CubeSpinner.tsx`

**Before:**
```tsx
import { Loader2 } from 'lucide-react';
<Loader2 className="animate-spin" />
```

**After:**
```tsx
import { Spinner } from '@/components/common';
<Spinner />
```

**Props:**
- `size?: number | "xs" | "sm" | "md" | "lg" | "xl"` - Default: "md" (44px)
- `label?: string` - Optional loading text
- `className?: string` - Additional CSS classes

### 2. **CustomCheckbox** - Animated Checkbox
Location: `src/components/common/CustomCheckbox.tsx`

**Before:**
```tsx
<input type="checkbox" checked={value} onChange={handleChange} />
<label>Option</label>
```

**After:**
```tsx
import { CustomCheckbox } from '@/components/common';
<CustomCheckbox
  checked={value}
  onChange={handleChange}
  label="Option"
/>
```

**Props:**
- All standard HTML input checkbox props
- `label?: string` - Optional label text

### 3. **EmojiToggle** - Toggle Switch with Emojis
Location: `src/components/common/EmojiToggle.tsx`

**Before:**
```tsx
<input type="checkbox" role="switch" checked={enabled} onChange={toggle} />
```

**After:**
```tsx
import { EmojiToggle } from '@/components/common';
<EmojiToggle
  checked={enabled}
  onChange={toggle}
  label="Enable Feature"
/>
```

**Features:**
- ✖️ emoji when unchecked (red background)
- ✔️ emoji when checked (green background)
- Smooth rotation animation

### 4. **AnimatedInput** - Text Input with Hover Effects
Location: `src/components/common/AnimatedInput.tsx`

**Before:**
```tsx
<input
  type="text"
  value={text}
  onChange={handleChange}
  placeholder="Enter text..."
/>
```

**After:**
```tsx
import { AnimatedInput } from '@/components/common';
<AnimatedInput
  value={text}
  onChange={handleChange}
  placeholder="Enter text..."
  label="Field Name"
/>
```

**Features:**
- Smooth border and shadow animation on hover/focus
- Blue glow effect
- Optional label

### 5. **InfoTooltip** - Information Icon with Tooltip
Location: `src/components/common/InfoTooltip.tsx`

**Before:**
```tsx
<span title="Information text">ℹ️</span>
```

**After:**
```tsx
import { InfoTooltip } from '@/components/common';
<InfoTooltip text="Information text" />
```

## Migration Strategy

### Phase 1: Spinners (38 files)
Files to update are in these locations:
- `src/components/gantt-tool/*.tsx`
- `src/app/**/*.tsx`
- `src/components/common/*.tsx`

**Search Pattern:** `Loader2|animate-spin|loading|spinner`

**Replace:**
```tsx
// Old
import { Loader2 } from 'lucide-react';
<Loader2 className="animate-spin h-4 w-4" />

// New
import { Spinner } from '@/components/common';
<Spinner size="xs" />
```

**Size mapping:**
- `h-4 w-4` → `size="xs"` (24px)
- `h-6 w-6` → `size="sm"` (32px)
- `h-8 w-8` → `size="md"` (44px)
- `h-12 w-12` → `size="lg"` (64px)
- `h-16 w-16` → `size="xl"` (80px)

### Phase 2: Checkboxes (7 files)
Files to update:
- `src/components/gantt-tool/QuickResourcePanel.tsx`
- `src/components/presales/ModeSelector.tsx`
- `src/components/organization/OrgChartTemplateSelector.tsx`
- `src/app/_components/ui/Checkbox.tsx`

**Search Pattern:** `type="checkbox"`

**Replace:**
```tsx
// Old
<div>
  <input
    type="checkbox"
    id="option1"
    checked={checked}
    onChange={handleChange}
  />
  <label htmlFor="option1">Option Label</label>
</div>

// New
import { CustomCheckbox } from '@/components/common';
<CustomCheckbox
  checked={checked}
  onChange={handleChange}
  label="Option Label"
/>
```

### Phase 3: Toggle Buttons
Look for switch-like components and replace with EmojiToggle.

**Patterns to find:**
- `role="switch"`
- Toggle switch patterns
- Boolean state toggles

### Phase 4: Text Inputs (20+ files)
Files with text inputs are numerous. Focus on:
- Login/Register pages
- Forms in modals
- Search inputs
- Name/title fields

**Search Pattern:** `type="text"|placeholder=`

**Replace:**
```tsx
// Old
<input
  type="text"
  className="border rounded px-3 py-2"
  value={value}
  onChange={onChange}
  placeholder="Enter text"
/>

// New
import { AnimatedInput } from '@/components/common';
<AnimatedInput
  value={value}
  onChange={onChange}
  placeholder="Enter text"
  label="Field Label"
/>
```

### Phase 5: Tooltips
Look for tooltip libraries or title attributes and replace with InfoTooltip.

**Patterns to find:**
- `title="..."`
- Tooltip components
- Help icons

## Automated Find & Replace

### VS Code Regex Find/Replace

**For Loader2 spinners:**
```regex
Find: import.*Loader2.*from.*lucide-react.*;
Replace: import { Spinner } from '@/components/common';

Find: <Loader2 className="animate-spin.*?" />
Replace: <Spinner />
```

**For basic checkboxes:**
```regex
Find: <input type="checkbox"
Replace: <CustomCheckbox
```

## Testing Checklist

After migration:

- [ ] All spinners display correctly
- [ ] Loading states work properly
- [ ] Checkboxes maintain their state
- [ ] Toggle switches work bidirectionally
- [ ] Form inputs accept text correctly
- [ ] Tooltips appear on hover
- [ ] Animations perform smoothly
- [ ] Reduced motion preferences are respected
- [ ] Components are accessible (keyboard navigation)
- [ ] Mobile responsiveness maintained

## Rollback Plan

If issues arise, the old components are still available:
- `AnimatedSpinner` (old bouncing cube)
- Standard HTML inputs can be used directly
- Lucide icons are still installed

## Import Shortcuts

All components can be imported from the common barrel export:

```tsx
import {
  Spinner,
  CustomCheckbox,
  EmojiToggle,
  AnimatedInput,
  InfoTooltip
} from '@/components/common';
```

## Example: Complete Form Migration

**Before:**
```tsx
<div className="space-y-4">
  <div>
    <label>Name</label>
    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
  </div>
  <div>
    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
    <label>I agree</label>
  </div>
  <div>
    <input type="checkbox" role="switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
    <label>Enable feature</label>
  </div>
  <button disabled={loading}>
    {loading && <Loader2 className="animate-spin" />}
    Submit
  </button>
</div>
```

**After:**
```tsx
import { AnimatedInput, CustomCheckbox, EmojiToggle, Spinner } from '@/components/common';

<div className="space-y-4">
  <AnimatedInput
    value={name}
    onChange={(e) => setName(e.target.value)}
    label="Name"
    placeholder="Enter your name"
  />

  <CustomCheckbox
    checked={agree}
    onChange={(e) => setAgree(e.target.checked)}
    label="I agree"
  />

  <EmojiToggle
    checked={enabled}
    onChange={(e) => setEnabled(e.target.checked)}
    label="Enable feature"
  />

  <button disabled={loading} className="flex items-center gap-2">
    {loading && <Spinner size="xs" />}
    Submit
  </button>
</div>
```

## Priority Files to Update

Start with these high-visibility files:

1. **Login Page** (`src/app/login/page.tsx`)
   - Text inputs for email/password
   - Loading spinner
   - Checkbox for "Remember me"

2. **Gantt Tool** (`src/components/gantt-tool/`)
   - Multiple modals with forms
   - Many loading states
   - Checkboxes in settings

3. **Organization Chart** (`src/app/organization-chart/page.tsx`)
   - Form inputs
   - Loading states

4. **Project Pages** (`src/components/project-v2/`)
   - Various form controls

## Need Help?

The new components are fully backward-compatible with standard HTML input props. If you encounter issues:

1. Check the component prop types in the TSX files
2. Ensure imports are correct
3. Test in isolation before deploying
4. Keep animations smooth by avoiding too many concurrent instances

---

Happy migrating! 🚀
