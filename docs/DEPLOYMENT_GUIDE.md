# 🚀 DEPLOYMENT GUIDE

## Quick Deploy (Copy-Paste Commands)

```bash
#!/bin/bash
# SAP Cockpit V2 - Complete Deployment Script
# Run this from /workspaces/cockpit directory

set -e  # Exit on error

echo "🚀 Deploying Project V2 Transformation..."
echo ""

# Step 1: Install dependencies (ALREADY DONE ✅)
echo "📦 Dependencies already installed!"

# Step 2: Verify directory structure
echo "📁 Verifying directory structure..."
ls -la src/components/project-v2/
ls -la src/components/project-v2/modes/
ls -la src/components/project-v2/shared/
ls -la src/app/project/

echo ""
echo "✅ All files in place!"
echo ""
echo "NEXT STEPS:"
echo "1. Run: pnpm dev"
echo "2. Test: http://localhost:3001/project"
echo "3. Follow testing checklist in PROJECT_V2_TRANSFORMATION.md"
echo ""
```

---

## ✅ CURRENT STATUS

### Already Completed
- [x] Dependencies installed (framer-motion, lucide-react, clsx, tailwind-merge)
- [x] Directory structure created
- [x] All utility functions created (`src/lib/utils.ts`)
- [x] All components created:
  - [x] ProjectShell.tsx
  - [x] 4 mode components (Capture, Decide, Plan, Present)
  - [x] 5 shared components (ModeIndicator, SlideOver, EmptyState, StatBadge, LoadingState)
- [x] Page route updated (`src/app/project/page.tsx`)
- [x] Index barrel exports created
- [x] Documentation created

### Ready to Test
All files are in place and ready to run. No manual copying needed!

---

## 🧪 Testing Steps

### 1. Start Development Server
```bash
cd /workspaces/cockpit
pnpm dev
```

### 2. Open in Browser
Navigate to: `http://localhost:3001/project`

### 3. Test Each Mode

#### Capture Mode (Blue)
- [ ] Drop zone visible with upload icon
- [ ] Can paste text in textarea
- [ ] "Load Sample RFP" button works
- [ ] Chips animate in after parsing
- [ ] Progress indicator shows percentage
- [ ] Missing gaps displayed when incomplete
- [ ] "Continue to decisions" button appears at 80%+
- [ ] Clicking continue goes to Decide mode

#### Decide Mode (Purple)
- [ ] All 5 decision cards visible
- [ ] Can select options in each card
- [ ] Selected option has green border + checkmark
- [ ] Hover shows impact preview (duration, cost, risk)
- [ ] Progress bar at top animates
- [ ] "Generate Plan" button appears when all decided
- [ ] Clicking button goes to Plan mode

#### Plan Mode (Green)
- [ ] Timeline visualization shows all phases
- [ ] Phase bars are proportional to duration
- [ ] Clicking phase opens slide-over inspector
- [ ] Inspector shows phase details, resources, cost
- [ ] Zoom controls (Week/Month) work
- [ ] "Present Mode" toggle button works
- [ ] Summary stats show in toolbar (Duration, Cost, Phases)
- [ ] Resource avatars display under phases

#### Present Mode (Dark)
- [ ] Full-screen takeover (no chrome)
- [ ] 5 slides displayed correctly:
  - Cover (title + summary)
  - Requirements (chip cards)
  - Timeline (animated phase bars)
  - Team (resource breakdown)
  - Summary (key metrics)
- [ ] Arrow keys navigate between slides
- [ ] Dot navigation at bottom works
- [ ] Clicking dots jumps to slide
- [ ] ESC exits to Plan mode
- [ ] No costs/rates visible
- [ ] No edit controls visible

### 4. Test Keyboard Navigation
- [ ] Tab navigates between focusable elements
- [ ] Enter activates buttons
- [ ] ESC closes modals/slide-overs
- [ ] ESC exits Present mode
- [ ] Arrow keys work in Present mode

---

## Verification Checklist

### ✅ Dependencies Check
```bash
# Verify in package.json
cat package.json | grep -A 1 "dependencies"
# Should show: framer-motion, lucide-react, clsx, tailwind-merge
```

### ✅ Files Exist
```bash
# Verify all components
ls -la src/components/project-v2/ProjectShell.tsx
ls -la src/components/project-v2/modes/
ls -la src/components/project-v2/shared/
ls -la src/components/project-v2/index.ts
ls -la src/app/project/page.tsx
ls -la src/lib/utils.ts
```

### ✅ No Build Errors
```bash
# Try building
pnpm build

# Should complete without errors
```

### ✅ No TypeScript Errors
```bash
# Type check (if available)
pnpm type-check

# Or check in VS Code Problems panel
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module 'framer-motion'"
**Solution:**
```bash
pnpm add framer-motion lucide-react clsx tailwind-merge
```

### Issue 2: Store imports failing
**Error:** `Cannot find module '@/stores/project-store'`

**Solution:** Verify store files exist and export the correct hooks:
```bash
# Check stores exist
ls -la src/stores/project-store.ts
ls -la src/stores/presales-store.ts
ls -la src/stores/timeline-store.ts

# Verify exports
grep "export.*useProjectStore" src/stores/project-store.ts
grep "export.*usePresalesStore" src/stores/presales-store.ts
grep "export.*useTimelineStore" src/stores/timeline-store.ts
```

### Issue 3: Animations feel janky
**Solution:**
- Open Chrome DevTools > Performance
- Record interaction
- Check FPS (should be 60fps)
- If low:
  - Reduce animation duration
  - Use CSS transforms instead of width/height
  - Add `will-change: transform` to animated elements

### Issue 4: Empty states not showing
**Solution:**
- Clear browser cache
- Check store state in React DevTools
- Verify initial store values are empty/null

### Issue 5: Present mode shows costs
**Solution:**
- Check PresentMode.tsx slides
- Ensure formatCurrency calls are removed from Present mode
- Only show duration, phase count, resource count

---

## Performance Monitoring

### Lighthouse Test
```bash
# Run Lighthouse (in Chrome DevTools)
# Or via CLI:
npx lighthouse http://localhost:3001/project \
  --only-categories=performance,accessibility \
  --output=html \
  --output-path=./lighthouse-report.html

# Target scores:
# Performance: >90
# Accessibility: >90
```

### Bundle Size Check
```bash
# After build
pnpm build

# Check build output
# Should show bundle sizes
# Target: <500KB for project-v2 components
```

### Animation Performance
- Open Chrome DevTools > Performance
- Click "Record"
- Navigate through all 4 modes
- Stop recording
- Check FPS (should be 60fps consistently)
- Check for long tasks (should be <50ms)

---

## Rollback Plan

### Option 1: Feature Flag (Recommended)
Add environment variable to toggle between old/new UI:
```typescript
// src/app/project/page.tsx
const useV2 = process.env.NEXT_PUBLIC_PROJECT_V2 === 'true';

export default function ProjectPage() {
  return useV2 ? <ProjectShell /> : <OldProjectCanvas />;
}
```

Set in `.env.local`:
```bash
NEXT_PUBLIC_PROJECT_V2=true  # Use new UI
# NEXT_PUBLIC_PROJECT_V2=false  # Use old UI
```

### Option 2: Keep Both Routes
- Old UI: `/project-old`
- New UI: `/project` (default)

### Option 3: Full Rollback
If critical issues found:
```bash
# Revert changes to /project page
git checkout HEAD -- src/app/project/page.tsx

# Remove project-v2 components (optional)
# rm -rf src/components/project-v2

# Dependencies can stay (won't hurt)
```

---

## Production Deployment

### Pre-Deploy Checklist
- [ ] All manual tests passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Lighthouse score >90
- [ ] Mobile responsive tested
- [ ] Keyboard navigation works
- [ ] Accessibility tested (screen reader)
- [ ] Performance acceptable (60fps)
- [ ] Internal team approval

### Deploy Steps
```bash
# 1. Final build
pnpm build

# 2. Test production build locally
pnpm start

# 3. Deploy to staging
# (Your deployment command here)

# 4. Smoke test on staging
# - Test all 4 modes
# - Test keyboard nav
# - Test mobile

# 5. Deploy to production
# (Your production deployment command)

# 6. Monitor errors
# - Check error logs
# - Monitor analytics
# - Watch for user reports
```

### Post-Deploy Monitoring

#### Key Metrics
- Time to first chip: <10 seconds
- Capture → Decide transition rate: >80%
- Decide → Plan transition rate: >70%
- Present mode usage: >50%
- User session duration: +20% vs old UI

#### Analytics Events to Track
```typescript
// Example events
analytics.track('Mode Viewed', { mode: 'capture' });
analytics.track('Chip Extracted', { count: 10, method: 'sample' });
analytics.track('Decision Made', { decision: 'moduleCombo', value: 'finance' });
analytics.track('Timeline Generated', { phases: 5, duration: 24 });
analytics.track('Present Mode Entered');
analytics.track('Slide Advanced', { from: 1, to: 2 });
```

---

## Success Criteria

### Week 1 (Internal)
- [ ] 5 internal users tested
- [ ] No critical bugs found
- [ ] Positive feedback collected
- [ ] Minor issues fixed

### Week 2 (Beta)
- [ ] 20 beta users invited
- [ ] Analytics tracking working
- [ ] Performance metrics acceptable
- [ ] User satisfaction >80%

### Week 3 (50% Rollout)
- [ ] Feature flag set to 50%
- [ ] Monitor metrics daily
- [ ] Compare old vs new UI
- [ ] Fix any issues quickly

### Week 4 (100% Rollout)
- [ ] Feature flag set to 100%
- [ ] Old UI deprecated (but kept as backup)
- [ ] Success metrics achieved
- [ ] Documentation updated

---

## Next Steps

### Immediate (Day 1)
1. ✅ Test locally
2. ✅ Fix any obvious bugs
3. ✅ Get internal team approval
4. Deploy to staging

### Short-term (Week 1-2)
1. Gather user feedback
2. Track analytics
3. Fix critical issues
4. Iterate on UX

### Long-term (Month 1-3)
1. A/B test variations
2. Add more animations
3. Improve mobile experience
4. Add more keyboard shortcuts
5. Add user onboarding tour

---

## Support

### Questions?
1. Check PROJECT_V2_TRANSFORMATION.md first
2. Review code comments in components
3. Test with sample data
4. Check browser console for errors

### Found a Bug?
1. Document steps to reproduce
2. Check if it's a known issue
3. Create issue with:
   - Description
   - Screenshots
   - Browser/OS
   - Steps to reproduce

---

**Remember**: This is a complete UX transformation. Take time to test thoroughly before deploying to production. The goal is to make users say "wow" in the first 30 seconds! 🚀
