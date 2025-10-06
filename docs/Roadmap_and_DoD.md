# Implementation Roadmap & Definition of Done

**Source:** UX_UI_AUDIT_COMPLETE.md (Section 8 - Priority matrix)
**Cross-ref:** All system redesign documents
**Date:** 2025-10-06

---

## 🎯 SCOPE

Re-baselined priority list from audit with **Definition of Done** per item.

---

## 📅 SPRINT 1 (Week 1): P0 - Critical Foundations

### P0-1: Connect Estimator → Project (1 day)

**Why:** Critical gap - 70% of users need this bridge (Tier 1 → Tier 2 handoff).

**Tasks:**
1. Create `src/lib/estimator/to-chips-converter.ts`
2. Add `handleBuildFullPlan()` to `/estimator/page.tsx`
3. Update `/project/page.tsx` to handle `?source=estimator` param
4. Show banner "Timeline from Quick Estimate"

**Definition of Done:**
- [ ] User clicks "Build Full Plan" in Estimator
- [ ] Data converts to chips (all fields mapped)
- [ ] Navigates to `/project?mode=plan` with data pre-filled
- [ ] Banner shows with link to edit decisions
- [ ] No data loss (verified with console logs)
- [ ] Mobile tested (button accessible)
- [ ] Analytics track('tier_transition', {from: 1, to: 2})

**Risk:** None (additive feature)

---

### P0-2: Remove/Merge OptimizeMode (4 hours)

**Why:** Incomplete implementation confuses users. Merge into PlanMode as tabs.

**Tasks:**
1. Add tab navigation to `PlanMode.tsx`
2. Move ResourcePanel into "Resources" tab
3. Move RicefwPanel into "RICEFW" tab
4. Delete `OptimizeMode.tsx`
5. Remove from `ProjectShell.tsx` lazy imports
6. Update mobile nav (5 → 4 buttons)

**Definition of Done:**
- [ ] PlanMode has 3 tabs: Timeline | Resources | RICEFW
- [ ] All tabs functional (no placeholder text)
- [ ] OptimizeMode file deleted
- [ ] No broken links to `/project?mode=optimize`
- [ ] Mobile nav shows 4 modes (not 5)
- [ ] No console errors
- [ ] ResourcePanel fully implemented (not "pending...")

**Risk:** Medium - Requires ResourcePanel completion.

**Mitigation:** If ResourcePanel blocked, keep tab but show "Coming soon" message (not broken).

---

### P0-3: Add Toast Notifications (2 hours)

**Why:** Replaces console.log and alerts with professional feedback.

**Tasks:**
1. Install `react-hot-toast`
2. Add `<Toaster />` to layout
3. Replace all `console.log` in CaptureMode
4. Replace all `alert()` in PlanMode/DecideMode
5. Create toast helper: `src/lib/toast.ts`

**Definition of Done:**
- [ ] react-hot-toast installed
- [ ] Toaster component in layout
- [ ] All console.log replaced (grep confirms)
- [ ] All alert() replaced
- [ ] Success toasts (green, checkmark icon)
- [ ] Error toasts (red, error icon)
- [ ] Loading toasts (spinner, auto-dismiss)

**Risk:** None (UI enhancement only)

---

## 📅 SPRINT 2 (Week 2): P1 - High-Impact Features

### P1-1: Regenerate Preview Modal (1 day)

**Why:** Prevents data loss on timeline regeneration (90% of users need this).

**Tasks:**
1. Create `src/components/project-v2/modes/RegenerateModal.tsx`
2. Show diff (phases added/removed, duration change)
3. Warn about manual edits
4. Add "Regenerate" and "Cancel" buttons
5. Hook into `regenerateTimeline()` call

**Definition of Done:**
- [ ] Modal appears before regeneration
- [ ] Shows count of manual edits at risk
- [ ] Shows diff (phases, duration, cost)
- [ ] Cancel returns to current state
- [ ] Confirm proceeds with regeneration
- [ ] Modal dismisses on completion
- [ ] Accessible (Escape key closes)

**Risk:** Low

---

### P1-2: PDF Export in PresentMode (2 days)

**Why:** **Critical** - 60% of sessions need export to complete workflow.

**Tasks:**
1. Install `jspdf` and `html2canvas`
2. Create `src/lib/presentation/pdf-exporter.ts`
3. Add "Export PDF" button to PresentMode
4. Render each slide to canvas → PDF
5. Add loading state during export
6. Track export completion analytics

**Definition of Done:**
- [ ] "Export PDF" button visible in PresentMode
- [ ] Clicking shows loading state
- [ ] PDF downloads with all slides
- [ ] PDF quality readable (high res)
- [ ] File name = project name + date
- [ ] Export tracked: track('export_complete', {format: 'pdf'})
- [ ] Error handling (shows toast on failure)
- [ ] Works on mobile (downloads correctly)

**Risk:** Medium - Canvas rendering may fail on some browsers

**Mitigation:** Add fallback: "Download HTML" if PDF fails

---

### P1-3: L3 Selector Search (4 hours)

**Why:** 200+ items unusable without search.

**Tasks:**
1. Add search input to L3SelectorModal
2. Filter items by name/code
3. Add tier filter buttons
4. Add industry presets

**Definition of Done:**
- [ ] Search input filters items in real-time
- [ ] Tier buttons filter (All/1/2/3/4)
- [ ] Industry presets add multiple items
- [ ] "No results" state shows when filter empty
- [ ] Search persists during session
- [ ] Mobile keyboard appears on input focus

**Risk:** None

---

## 📅 SPRINT 3 (Weeks 3-4): P2 - State Unification

### P2-1: Unified Project Store (3 days)

**Why:** Foundation for data continuity across tiers.

**Tasks:**
1. Create `src/stores/unified-project-store.ts`
2. Define `UnifiedProject` interface
3. Add migration from legacy stores
4. Update Estimator to save to unified store
5. Update Project to read from unified store
6. Add localStorage versioning

**Definition of Done:**
- [ ] Unified store created with full interface
- [ ] Migration utility converts old data
- [ ] Estimator saves estimates to store
- [ ] Project reads from store correctly
- [ ] No data loss during migration
- [ ] Backward compatible (old projects load)
- [ ] Tests pass (integration tests)

**Risk:** High - Data migration can corrupt projects

**Mitigation:**
- Phase 1: Create store, keep old stores (dual-write)
- Phase 2: Migrate components one by one
- Phase 3: Deprecate old stores after validation

---

### P2-2: Dynamic Slide Generation (1 day)

**Why:** Hardcoded 5 slides don't adapt to project data.

**Tasks:**
1. Create `src/lib/presentation/slide-generator.ts`
2. Conditional slide logic (if RICEFW, if >3 phases, etc.)
3. Update PresentMode to use generated slides
4. Add slide reordering UI

**Definition of Done:**
- [ ] Slides generated based on project data
- [ ] RICEFW slide only if items exist
- [ ] Phase breakdown only if >3 phases
- [ ] Slide count varies by project (5-8 range)
- [ ] User can reorder slides
- [ ] User can hide/show slides

**Risk:** Low

---

## 📅 FUTURE (Sprint 4+): P3 - Polish & Optimization

### P3-1: Benchmark Comparison (2 days)

- Industry average comparison in Estimator
- "Recommended for you" badges in DecideMode
- Timeline validation in PlanMode

### P3-2: Dark Mode (1 day)

- CSS variables setup
- Tailwind dark mode config
- Theme toggle in settings

### P3-3: First-Time Onboarding (2 days)

- Pre-login Quick Estimate (no signup)
- Gratitude animation
- Value calculator on landing page

---

## 🧪 TESTING STRATEGY

### Unit Tests
```bash
# Run all tests
npm test

# Critical paths
npm test -- to-chips-converter.test.ts
npm test -- unified-project-store.test.ts
npm test -- pdf-exporter.test.ts
```

### Integration Tests
```bash
# E2E flow
npm test -- estimator-to-project-flow.test.ts
```

### Manual QA Checklist (Per Sprint)

**Sprint 1:**
- [ ] Estimator → Project bridge works
- [ ] OptimizeMode removed, no broken links
- [ ] Toasts show for all actions

**Sprint 2:**
- [ ] Regenerate modal shows diff
- [ ] PDF export downloads correctly
- [ ] L3 search filters items

**Sprint 3:**
- [ ] Unified store persists data
- [ ] Slides generate dynamically
- [ ] No data corruption

---

## 📊 SUCCESS METRICS (Per Sprint)

### Sprint 1 Metrics
- Bridge adoption rate: > 50% (target: 70%)
- Toast engagement: > 80% users see at least 1 toast
- OptimizeMode errors: 0 (down from current state)

### Sprint 2 Metrics
- Export rate: > 40% (target: 60%)
- Regenerate preview views: > 70% (target: 90%)
- L3 search usage: > 60% of estimator sessions

### Sprint 3 Metrics
- State migration success: 100% (no data loss)
- Dynamic slide satisfaction: User survey > 8/10
- End-to-end time: < 10 min (from estimate to export)

---

## 🚨 RISK LOG

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| PDF export fails on Safari | Medium | High | Add fallback HTML export | Engineering |
| Unified store migration corrupts data | Low | Critical | Dual-write phase, extensive testing | Engineering |
| OptimizeMode users complain | Low | Medium | Keep as hidden tab, add "legacy mode" | Product |
| ResourcePanel blocked on backend | Medium | Medium | Mock data for demo, API later | Engineering |

---

## ✅ OVERALL DEFINITION OF DONE

**Entire redesign is COMPLETE when:**

- [ ] All P0 items shipped (Sprint 1)
- [ ] All P1 items shipped (Sprint 2)
- [ ] Unified store operational (Sprint 3)
- [ ] All integration tests passing
- [ ] Manual QA checklist 100% pass rate
- [ ] Success metrics hit targets (or plan adjust)
- [ ] No P0/P1 bugs in production
- [ ] Analytics tracking live (all events firing)
- [ ] Documentation updated (README, CLAUDE.md)
- [ ] User interviews conducted (5 users, positive feedback)

---

## 📞 STAKEHOLDER CHECKPOINTS

**Weekly:**
- Sprint progress update (Slack/email)
- Metrics dashboard review
- Blocker escalation

**End of Sprint:**
- Demo to stakeholders (live walkthrough)
- Retrospective (what worked, what didn't)
- Next sprint planning

---

**End of Roadmap & DoD**

**This completes all 9 deliverables from the mission brief.**

**Cross-references:**
- Holistic_Redesign_V2.md (Overall strategy)
- Measurement_and_Experiments.md (Metrics)
- All other specs (Implementation details)
