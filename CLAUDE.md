# Cockpit Project - Claude Code Instructions

## MANDATORY POLICIES - READ BEFORE ANY ACTION

**CRITICAL: Before making ANY changes to this codebase, you MUST:**

1. **READ** `/policy/ULTIMATE GLOBAL QUALITY.md` - Non-negotiable quality standards
2. **READ** `/policy/UX System.md` - UI/UX implementation standards
3. **APPLY** all policy requirements to every change, no exceptions

These policies are NOT optional guidelines - they are binding requirements.

---

## Policy Enforcement Checklist

### Before EVERY Task (Mandatory)

```
[ ] Read /policy/ULTIMATE GLOBAL QUALITY.md
[ ] Read /policy/UX System.md
[ ] Understand the full scope of the change
[ ] Identify ALL files/components affected (system-level thinking)
[ ] Consider security implications (OWASP mindset)
[ ] Consider performance implications
[ ] Consider mobile/responsive behavior
[ ] Plan for regression testing
```

### During Implementation (Mandatory)

```
[ ] Priority order: SECURITY → DATA INTEGRITY → PERFORMANCE → UX → SCOPE
[ ] No emojis or decorative icons in UI
[ ] No documentation files generated in repo
[ ] Apply fixes globally across similar patterns, not just locally
[ ] Use semantic colors from design system
[ ] Ensure 44px minimum touch targets (WCAG 2.5.5)
[ ] Handle all states: loading, empty, error, success
[ ] Consider all breakpoints: mobile, tablet, desktop
```

### After Implementation (Mandatory)

```
[ ] Verify no security vulnerabilities introduced
[ ] Verify no performance regressions
[ ] Verify responsive behavior on all breakpoints
[ ] Verify accessibility compliance
[ ] Run type checking (no TypeScript errors)
[ ] Run linting (no ESLint errors)
[ ] Build succeeds without errors
[ ] Provide evidence of quality in response
```

---

## Core Policy Requirements Summary

### From ULTIMATE GLOBAL QUALITY.md

1. **Priority Order**: SECURITY → DATA INTEGRITY → PERFORMANCE → UX → SCOPE

2. **Hard Constraints**:
   - NO documentation generation in repo (README, markdown files, etc.)
   - NO emojis or decorative icons in UI
   - NEVER hallucinate or overclaim (don't claim tests were run if they weren't)

3. **System-Level Thinking**:
   - Think architecture, flows, and interactions across the whole product
   - Don't limit fixes to where the issue was reported - fix ALL similar patterns
   - Multi-device, multi-browser reality (not just F12 emulation)

4. **Security by Design** (OWASP mindset):
   - Validate all externally influenced input at trust boundaries
   - Never store secrets in client-side code
   - Handle auth and permissions on the server
   - No sensitive details in error messages

5. **Performance by Design**:
   - Optimal time/space complexity
   - Minimize network roundtrips
   - Avoid unnecessary re-renders
   - Use code-splitting and lazy loading

6. **Apple-Grade UX**:
   - Modern, clean, minimalist, enterprise-grade
   - Treat visual/UX defects as seriously as functional bugs
   - No "good enough" solutions - outcomes must feel deliberate and refined

7. **Real Mobile Behavior**:
   - Test on real devices, not just F12 emulation
   - Consider: soft keyboard, safe areas, viewport units, touch events
   - Provide manual test instructions for physical device testing

8. **Aggressive Regression Testing**:
   - Positive flows, negative cases, boundary conditions
   - Visual regression: layout, spacing, typography, colors, states
   - Change is NOT "done" if any critical UX/visual regression remains

### From UX System.md

1. **Accessibility (WCAG 2.1)**:
   - All interactive elements minimum 44x44px touch targets
   - All text meets 4.5:1 contrast ratio
   - Visible focus rings on all interactive elements
   - Full keyboard support with logical tab order

2. **Responsive Breakpoints**:
   - Mobile: < 600px (single column, collapsed sidebar)
   - Tablet: 600-900px (2-column grids, collapsible sidebar)
   - Desktop: 900-1280px (3-column grids)
   - Desktop XL: > 1280px (5-column grids, full layout)

3. **Design Tokens**:
   - Use semantic colors: foreground, muted, background, surface, border, accent
   - Use status colors: success, warning, error, info
   - Use spacing system: space-1 (4px) through space-12 (48px)
   - Use typography scale: display, h1, h2, h3, body-lg, body, caption, overline

4. **Component Patterns**:
   - Use CVA (class-variance-authority) for type-safe variants
   - Use cn() helper for class composition
   - Follow shadcn/ui component patterns

---

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with design tokens
- **Database**: Prisma ORM
- **State**: Zustand
- **Components**: CVA + shadcn/ui patterns
- **Icons**: Lucide React (functional only, no decorative)

---

## Quality Gates Before PR/Merge

Run these commands and ensure ALL pass:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Tests
npm test

# Production build
npm run build
```

**ALL must pass. No exceptions. No skipping.**

---

## Response Format Requirements

Every response involving code changes MUST include:

1. **What changed**: Clear summary of changes and locations
2. **Why**: Rationale aligned with policy requirements
3. **Security considerations**: Risks identified and mitigations applied
4. **Performance considerations**: Impact and optimizations
5. **Visual/UX impact**: Breakpoints and states considered
6. **Testing approach**: Categories of tests designed/run
7. **Limitations**: What couldn't be verified (e.g., real device testing)

---

## Escalation Protocol

If a user request conflicts with these policies:

1. **STOP** - Do not proceed with the conflicting change
2. **EXPLAIN** - Clearly state which policy is violated and why it matters
3. **PROPOSE** - Offer a safer/better alternative that complies with policies
4. **DOCUMENT** - If user insists, explicitly label the trade-off before proceeding

**Never silently lower the quality bar, even for "quick hacks".**
