# Manual Real-Device Validation Protocol

Status: Active
Last Updated: 2026-02-20

## Purpose
Ensure core user journeys work correctly on real devices beyond automated CI testing.
Manual validation catches issues that automated tests cannot: touch interactions, viewport rendering, native keyboard behavior, and platform-specific quirks.

## Target Devices

### Minimum Device Matrix

| Device | OS | Browser | Priority |
|---|---|---|---|
| iPhone 14+ | iOS 17+ | Safari | P1 |
| iPhone SE (3rd gen) | iOS 17+ | Safari | P1 (small screen) |
| iPad Air | iPadOS 17+ | Safari | P2 |
| Samsung Galaxy S23+ | Android 14+ | Chrome | P1 |
| Pixel 7 | Android 14+ | Chrome | P1 |
| Galaxy Tab S9 | Android 14+ | Chrome | P2 (tablet) |
| MacBook (any) | macOS 14+ | Chrome, Safari | P1 |
| Windows laptop | Windows 11 | Chrome, Edge | P1 |

### Viewport Breakpoints to Verify

| Breakpoint | Width | Target |
|---|---|---|
| Mobile S | 320px | iPhone SE |
| Mobile M | 375px | Standard phone |
| Mobile L | 425px | Large phone |
| Tablet | 768px | iPad portrait |
| Laptop | 1024px | Small laptop |
| Desktop | 1440px | Standard desktop |

## Core User Journeys

### Journey 1: Authentication Flow
1. Navigate to `/login`
2. Enter credentials / use magic link / use passkey
3. Complete OTP verification (if applicable)
4. Verify redirect to `/dashboard`
5. Verify session persists on page refresh
6. Logout and verify redirect to `/login`

**Check**: Form inputs receive focus correctly, virtual keyboard doesn't obscure inputs, error messages are visible, touch targets are >= 44x44px.

### Journey 2: Dashboard Overview
1. Navigate to `/dashboard` (after auth)
2. Verify all dashboard cards/widgets render
3. Verify data loads without layout shift
4. Test responsive layout at each breakpoint
5. Verify interactive elements respond to touch/click

**Check**: No horizontal scroll at any breakpoint, charts render correctly, loading states visible.

### Journey 3: Gantt Tool
1. Navigate to `/gantt-tool`
2. Open an existing project or create new
3. Add/edit a task (drag timeline bar on touch devices)
4. Verify zoom/pan works with pinch gestures (mobile)
5. Verify toolbar is accessible at all viewports
6. Save changes

**Check**: Touch drag works for timeline editing, pinch-to-zoom functional, no overlapping UI at small viewports.

### Journey 4: Admin Panel
1. Navigate to `/admin` (requires admin role)
2. Verify user list renders with pagination
3. Test user search/filter functionality
4. Approve/reject a pending request
5. Verify audit trail shows the action

**Check**: Tables scroll horizontally on small screens, action buttons accessible, filter controls usable.

### Journey 5: Settings
1. Navigate to `/settings`
2. Update profile information
3. Navigate to `/settings/security`
4. Verify security settings render
5. Test passkey management (if available)

**Check**: Form validation works, save confirmations visible, back navigation works.

## Accessibility Checks (Per Journey)

For each journey, verify:

| Check | Method | WCAG Criterion |
|---|---|---|
| Focus visible | Tab through all interactive elements | 2.4.7 Focus Visible |
| Touch targets | Measure interactive elements >= 44x44px | 2.5.8 Target Size |
| Color contrast | Visual inspection + device accessibility tools | 1.4.3 Contrast |
| Screen reader | Activate VoiceOver (iOS) / TalkBack (Android) | 4.1.2 Name, Role, Value |
| Zoom | Pinch to 200% zoom, verify layout | 1.4.4 Resize Text |
| Orientation | Rotate device, verify layout adapts | 1.3.4 Orientation |
| Reduced motion | Enable "Reduce Motion" in OS settings | 2.3.3 Animation |

## Validation Checklist Template

Use this template for each validation session:

```
## Validation Session
Date: YYYY-MM-DD
Tester: Name
Device: [Device name, OS version, Browser version]
Environment: [Staging/Production URL]

### Results
| Journey | Status | Issues Found |
|---|---|---|
| 1. Authentication | Pass/Fail | |
| 2. Dashboard | Pass/Fail | |
| 3. Gantt Tool | Pass/Fail | |
| 4. Admin Panel | Pass/Fail | |
| 5. Settings | Pass/Fail | |

### Accessibility Checks
| Check | Status | Notes |
|---|---|---|
| Focus visible | Pass/Fail | |
| Touch targets | Pass/Fail | |
| Color contrast | Pass/Fail | |
| Screen reader | Pass/Fail | |
| Zoom 200% | Pass/Fail | |
| Orientation | Pass/Fail | |
| Reduced motion | Pass/Fail | |

### Issues Filed
- [ ] Issue #XX: Description
```

## Cadence

| Event | Frequency | Scope |
|---|---|---|
| Quick smoke test | Per release | Journey 1 + 2 on one mobile device |
| Full matrix test | Monthly | All journeys on P1 devices |
| Comprehensive audit | Quarterly | All journeys on full device matrix + a11y |

## Known Platform-Specific Issues

1. **iOS Safari**: Date inputs may not support `type="date"` consistently. Use `suppressHydrationWarning` on date elements (see `docs/RENDERING_STRATEGY.md`).
2. **Android Chrome**: Virtual keyboard can push fixed-position elements off-screen. Verify modal/toolbar placement.
3. **Safari (all)**: CSS `backdrop-filter` performance varies. Test blur effects on older devices.
4. **Touch devices**: Hover states not applicable. Verify all hover-triggered UI has touch alternatives.
