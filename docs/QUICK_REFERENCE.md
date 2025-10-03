# ⚡ QUICK REFERENCE

## 🚀 Get Started in 3 Steps

```bash
# 1. Dependencies (ALREADY INSTALLED ✅)
cd /workspaces/cockpit
# framer-motion, lucide-react, clsx, tailwind-merge already added

# 2. Files (ALREADY CREATED ✅)
# All components already in place in src/

# 3. Start server
pnpm dev
# Visit: http://localhost:3001/project
```

---

## 🎯 Mode Cheat Sheet

| Mode | Purpose | Primary Action | Keyboard | Next Step |
|------|---------|----------------|----------|-----------|
| **Capture** | Extract requirements | Drop RFP / Load Sample | None | → Decide |
| **Decide** | Make decisions | Select 5 options | Tab/Enter | → Plan |
| **Plan** | Adjust timeline | Click phases | Arrows/ESC | → Present |
| **Present** | Show clients | Navigate slides | Arrows/ESC | Exit |

---

## ⌨️ Keyboard Shortcuts

### Global
- `Tab` - Navigate focusable elements
- `Enter` - Activate button/selection
- `ESC` - Close modal/exit present mode

### Present Mode Only
- `←` - Previous slide
- `→` - Next slide
- `Click dots` - Jump to slide
- `ESC` - Exit to Plan mode

---

## 📦 File Locations

```
Component                           Path
─────────────────────────────────── ────────────────────────────────────────
Main Shell                          src/components/project-v2/ProjectShell.tsx
Capture Mode                        src/components/project-v2/modes/CaptureMode.tsx
Decide Mode                         src/components/project-v2/modes/DecideMode.tsx
Plan Mode                           src/components/project-v2/modes/PlanMode.tsx
Present Mode                        src/components/project-v2/modes/PresentMode.tsx
Mode Indicator                      src/components/project-v2/shared/ModeIndicator.tsx
Slide Over                          src/components/project-v2/shared/SlideOver.tsx
Empty State                         src/components/project-v2/shared/EmptyState.tsx
Stat Badge                          src/components/project-v2/shared/StatBadge.tsx
Loading State                       src/components/project-v2/shared/LoadingState.tsx
Page Route                          src/app/project/page.tsx
Utilities                           src/lib/utils.ts
Index                               src/components/project-v2/index.ts
```

---

## 🎨 Color Palette

```css
/* Mode Colors */
Capture:  #3b82f6 (Blue)
Decide:   #8b5cf6 (Purple)
Plan:     #10b981 (Green)
Present:  #1f2937 (Dark Gray)

/* Semantic Colors */
Success:  #10b981
Warning:  #f59e0b
Danger:   #ef4444
Gray:     #6b7280
```

---

## 🧪 Quick Test Checklist

```bash
# Capture Mode
✓ Drop zone works
✓ Sample RFP loads
✓ Chips extract correctly
✓ Progress shows correctly
✓ CTA appears at 80%+

# Decide Mode
✓ 5 decisions visible
✓ Hover shows preview
✓ Selection works
✓ CTA appears when complete

# Plan Mode
✓ Timeline shows phases
✓ Click opens inspector
✓ Zoom controls work
✓ Present toggle works

# Present Mode
✓ Full-screen (no chrome)
✓ Slides navigate
✓ ESC exits
✓ Costs hidden
```

---

## 🐛 Common Issues & Fixes

### "Cannot find module 'framer-motion'"
```bash
pnpm add framer-motion lucide-react clsx tailwind-merge
```

### "Type error: Phase is not defined"
```typescript
// Check src/stores/timeline-store.ts exports Phase type
export type Phase = { ... };
```

### "Animations feel slow"
```typescript
// In components, reduce duration:
transition={{ duration: 0.2 }} // was 0.3
```

### "Empty state not showing"
```typescript
// Check if condition in mode component:
if (chips.length === 0) return <EmptyState ... />
```

### "Store hooks not found"
```typescript
// Verify stores exist and export hooks
// src/stores/project-store.ts → export { useProjectStore }
// src/stores/presales-store.ts → export { usePresalesStore }
// src/stores/timeline-store.ts → export { useTimelineStore }
```

---

## 📊 Key Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| Time to First Chip | <10s | Analytics |
| FPS (animations) | 60fps | Chrome DevTools |
| Lighthouse Score | >90 | Lighthouse CI |
| Capture→Decide transition | >80% | Analytics |
| Present Mode usage | >50% | Analytics |

---

## 🔗 Important Links

- **Main Documentation**: `docs/PROJECT_V2_TRANSFORMATION.md`
- **Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`
- **This Quick Reference**: `docs/QUICK_REFERENCE.md`
- **Framer Motion Docs**: https://www.framer.com/motion/
- **Lucide Icons**: https://lucide.dev/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 💡 Pro Tips

1. **Test with real data first** - Don't use Lorem Ipsum
2. **Watch users** - See where they get stuck
3. **Measure everything** - Time, clicks, scrolls
4. **Ship small fixes fast** - Don't wait for perfection
5. **Celebrate wins** - UX transformations are hard!

---

## 🏗️ Architecture Overview

```
ProjectShell (Main Orchestrator)
├── ModeIndicator (Hero Banner)
└── Current Mode Component
    ├── CaptureMode
    │   ├── Drop zone + Paste area
    │   ├── Sample RFP button
    │   ├── Chip list with animations
    │   └── Progress indicator
    ├── DecideMode
    │   ├── Decision cards (5 total)
    │   ├── Option selection
    │   ├── Impact preview (SlideOver)
    │   └── Progress bar
    ├── PlanMode
    │   ├── Timeline visualization
    │   ├── Phase inspector (SlideOver)
    │   ├── Zoom controls
    │   └── Toolbar with stats
    └── PresentMode
        ├── 5 slides (Cover, Requirements, Timeline, Team, Summary)
        ├── Dot navigation
        └── Arrow key controls
```

---

## 🧩 Component Props Quick Reference

### ProjectShell
```typescript
// No props - uses global stores
```

### ModeIndicator
```typescript
interface Props {
  mode: 'capture' | 'decide' | 'plan' | 'present';
  progress?: number;           // Optional progress (0-100)
  showProgress?: boolean;      // Show progress bar?
}
```

### SlideOver
```typescript
interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;     // Default: 480
  children: React.ReactNode;
  side?: 'left' | 'right';     // Default: 'right'
}
```

### EmptyState
```typescript
interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

### StatBadge
```typescript
interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}
```

### LoadingState
```typescript
interface Props {
  type?: 'chip' | 'timeline' | 'decision';
  count?: number;              // Default: 3
  className?: string;
}
```

---

## 🔍 Debugging Tips

### Check Store State
```typescript
// In Chrome DevTools Console
// (Requires React DevTools extension)
// Select component → Props → View store state
```

### Monitor Animations
```javascript
// Chrome DevTools > Performance
// Record → Interact → Stop → Analyze FPS
// Should be 60fps consistently
```

### View Bundle Size
```bash
# After build
pnpm build
# Check output - project-v2 chunks should be <500KB
```

### Test Keyboard Navigation
```bash
# Use Tab to navigate
# Check focus indicators are visible
# Test in Chrome, Firefox, Safari
```

---

## 🆘 Need Help?

### Step 1: Check Documentation
1. `docs/PROJECT_V2_TRANSFORMATION.md` - Full overview
2. `docs/DEPLOYMENT_GUIDE.md` - Testing & deployment
3. `docs/QUICK_REFERENCE.md` - This file

### Step 2: Review Code
- Read component comments
- Check PropTypes/interfaces
- Look for TODO comments

### Step 3: Test with Sample Data
```typescript
// In CaptureMode.tsx
const SAMPLE_RFP = `...`;  // Use this for testing
```

### Step 4: Check Browser Console
- Look for errors
- Check network requests
- Verify imports resolved

### Step 5: Ask for Help
- Document the issue
- Include steps to reproduce
- Share screenshots
- Note browser/OS

---

## 📈 Success Indicators

### Week 1
- ✓ All modes load without errors
- ✓ Animations smooth (60fps)
- ✓ Keyboard navigation works
- ✓ Internal team approves

### Week 2-3
- ✓ User feedback positive
- ✓ Time to first chip <10s
- ✓ Present mode usage >50%
- ✓ No critical bugs reported

### Month 1
- ✓ Full rollout complete
- ✓ Metrics exceed targets
- ✓ User satisfaction high
- ✓ Ready for next iteration

---

**Remember**: This transformation is about making users say "wow" in the first 30 seconds. Every detail matters. Ship with confidence! 🚀
